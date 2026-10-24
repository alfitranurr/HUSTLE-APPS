// Hustle migrations + RLS on PGlite (Postgres in WASM) with stub Supabase auth/storage schemas.
// Run: npm run test:db
//
// The bootstrap copies Supabase's defaults that matter for security: every new
// table/function in public is granted to anon, authenticated and service_role,
// and service_role bypasses RLS. So these tests prove the migrations' own
// revokes, column grants and policies do the isolating.
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIG = process.argv[2] ?? fileURLToPath(new URL('../migrations', import.meta.url));
const db = new PGlite();

await db.exec(`
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
create schema auth;
create table auth.users (
  id uuid primary key, email text,
  raw_app_meta_data jsonb not null default '{}', raw_user_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now(), email_confirmed_at timestamptz, last_sign_in_at timestamptz
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
create function storage.foldername(name text) returns text[] language plpgsql immutable as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end $$;
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated;
grant usage on schema public to service_role;
`);

const files = readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  await db.exec(readFileSync(join(MIG, f), 'utf8'));
  console.log('✔ migration', f);
}
// The bucket insert must be safe to re-run.
await db.exec(readFileSync(join(MIG, '0003_storage.sql'), 'utf8').split('-- Own folder only.')[0]);
console.log('✔ bucket upsert is idempotent');

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const HASH = (c) => c.repeat(64);

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log('  ✔', name);
  } else {
    fail++;
    console.log('  ✘', name, extra);
  }
}
const show = (r) => JSON.stringify(r);

async function as(role, sub, sql, params = []) {
  try {
    const res = await db.transaction(async (tx) => {
      await tx.exec(`set local role ${role}`);
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [sub ?? '']);
      return tx.query(sql, params);
    });
    return { rows: res.rows, affected: res.affectedRows };
  } catch (e) {
    return { error: e.message };
  }
}

// ── Sign-up trigger ─────────────────────────────────────────────────
await db.query(
  `insert into auth.users (id, email, raw_user_meta_data) values
   ($1, 'a@example.com', '{"full_name":"  User A  "}'), ($2, 'b@example.com', '{}')`,
  [A, B]
);
console.log('\nSign-up:');
let r = await db.query(`select id, display_name from public.profiles order by id`);
check('profile created for every new user', r.rows.length === 2);
check('display name from metadata, trimmed', r.rows[0].display_name === 'User A', show(r.rows));
check('display name null when metadata is empty', r.rows[1].display_name === null);
r = await db.query(`select user_id, weekly_applications, weekly_interviews from public.user_settings order by user_id`);
check('default weekly targets created (5 / 2)', r.rows.length === 2 && r.rows[0].weekly_applications === 5 && r.rows[0].weekly_interviews === 2);

// ── Approval gate: new accounts are pending ─────────────────────────
console.log('\nApproval gate:');
r = await db.query(`select status, is_admin from public.profiles`);
check('new accounts start pending, not admin', r.rows.every((p) => p.status === 'pending' && p.is_admin === false), show(r.rows));
r = await as('authenticated', A, `select status from public.profiles`);
check('a pending user can read own status', r.rows?.length === 1 && r.rows[0].status === 'pending', show(r));
r = await as('authenticated', A, `select 1 from public.user_settings`);
check('a pending user sees no settings', !r.error && r.rows.length === 0, show(r));
r = await as('authenticated', A, `insert into public.jobs (company) values ('Too early')`);
check('a pending user cannot add jobs', !!r.error, show(r));
r = await as('authenticated', A, `insert into public.api_tokens (name, token_prefix, token_hash) values ('x', 'hst_ab12', $1)`, [HASH('7')]);
check('a pending user cannot create tokens', !!r.error);
r = await as('authenticated', A, `insert into storage.objects (bucket_id, name) values ('proofs', $1)`, [`${A}/x/cv.pdf`]);
check('a pending user cannot upload proofs', !!r.error);
r = await as('authenticated', A, `update public.profiles set status = 'approved' where id = $1`, [A]);
check('a user cannot approve self', !!r.error);
r = await as('authenticated', A, `update public.profiles set is_admin = true where id = $1`, [A]);
check('a user cannot make self admin', !!r.error);
await db.query(`update public.profiles set status = 'approved' where id in ($1, $2)`, [A, B]);

// ── anon gets nothing ───────────────────────────────────────────────
console.log('\nanon:');
for (const t of ['profiles', 'user_settings', 'jobs', 'job_attachments', 'interview_questions', 'candidate_profiles', 'recommendations', 'api_tokens']) {
  r = await as('anon', null, `select 1 from public.${t}`);
  check(`anon cannot read ${t}`, !!r.error, show(r));
}
r = await as('anon', null, `insert into public.jobs (company) values ('x')`);
check('anon cannot insert jobs', !!r.error);

// ── Jobs ────────────────────────────────────────────────────────────
console.log('\nJobs:');
r = await as('authenticated', A, `insert into public.jobs (company, position, status, stage, platform) values ('Acme', 'Data Analyst', 'In Progress', 'Document Screening', 'LinkedIn') returning id, user_id`);
check('A inserts a job; user_id comes from auth.uid()', !r.error && r.rows[0].user_id === A, show(r));
const jobA = r.rows?.[0]?.id;
r = await as('authenticated', B, `insert into public.jobs (company) values ('Beta Corp') returning id`);
const jobB = r.rows?.[0]?.id;
r = await as('authenticated', A, `insert into public.jobs (company, user_id) values ('Spoof', $1)`, [B]);
check('A cannot insert a job with user_id set (mass assignment)', !!r.error, show(r));
r = await as('authenticated', A, `insert into public.jobs (company, legacy_id) values ('Legacy', 'ID-1')`);
check('A cannot set legacy_id (migration only)', !!r.error);
r = await as('authenticated', B, `select id from public.jobs`);
check('B sees only own job', r.rows?.length === 1 && r.rows[0].id === jobB, show(r));
r = await as('authenticated', B, `update public.jobs set company = 'Hacked' where id = $1`, [jobA]);
check("B cannot update A's job (0 rows)", !r.error && r.affected === 0, show(r));
r = await as('authenticated', B, `delete from public.jobs where id = $1`, [jobA]);
check("B cannot delete A's job (0 rows)", !r.error && r.affected === 0, show(r));
r = await as('authenticated', A, `update public.jobs set user_id = $1 where id = $2`, [B, jobA]);
check('A cannot change user_id', !!r.error);
r = await as('authenticated', A, `update public.jobs set created_at = now() where id = $1`, [jobA]);
check('A cannot change created_at', !!r.error);
r = await as('authenticated', A, `update public.jobs set company = 'Acme Indonesia', updated_at = '2026-01-01T00:00:00Z' where id = $1 returning updated_at`, [jobA]);
check('A updates own job and can keep/set "last updated"', !r.error && r.affected === 1 && String(new Date(r.rows[0].updated_at).getUTCFullYear()) === '2026', show(r));
r = await as('authenticated', A, `insert into public.jobs (company, status) values ('Bad', 'Hired')`);
check('unknown status rejected', !!r.error);
r = await as('authenticated', A, `insert into public.jobs (company, link_website) values ('Bad', 'javascript:alert(1)')`);
check('non-http link rejected', !!r.error);
r = await as('authenticated', A, `insert into public.jobs (company, stage_dates) values ('Bad', '[]')`);
check('stage_dates must be a JSON object', !!r.error);

// ── Attachments ─────────────────────────────────────────────────────
console.log('\nAttachments:');
r = await as('authenticated', A, `insert into public.job_attachments (job_id, storage_path, file_name, mime_type, size_bytes) values ($1, $2, 'cv.pdf', 'application/pdf', 1000) returning user_id`, [jobA, `${A}/${jobA}/cv.pdf`]);
check('A attaches a file to own job in own folder', !r.error && r.rows[0].user_id === A, show(r));
r = await as('authenticated', A, `insert into public.job_attachments (job_id, storage_path, file_name, mime_type, size_bytes) values ($1, $2, 'x.pdf', 'application/pdf', 1)`, [jobA, `${B}/${jobA}/x.pdf`]);
check("path in someone else's folder rejected", !!r.error);
r = await as('authenticated', A, `insert into public.job_attachments (job_id, storage_path, file_name, mime_type, size_bytes) values ($1, $2, 'x.pdf', 'application/pdf', 1)`, [jobB, `${A}/${jobB}/x.pdf`]);
check("attaching to B's job rejected", !!r.error, show(r));
r = await as('authenticated', A, `insert into public.job_attachments (job_id, storage_path, file_name, mime_type, size_bytes) values ($1, $2, 'x.exe', 'application/x-msdownload', 1)`, [jobA, `${A}/${jobA}/x.exe`]);
check('unsupported mime type rejected', !!r.error);
r = await as('authenticated', A, `insert into public.job_attachments (job_id, storage_path, file_name, mime_type, size_bytes) values ($1, $2, 'big.pdf', 'application/pdf', 5000000)`, [jobA, `${A}/${jobA}/big.pdf`]);
check('file over 4 MB rejected', !!r.error);
r = await as('authenticated', B, `select 1 from public.job_attachments`);
check("B can't see A's attachments", r.rows?.length === 0, show(r));
r = await as('authenticated', A, `update public.job_attachments set storage_path = 'x'`);
check('attachments cannot be re-pointed (no update)', !!r.error);

// ── Interview questions + record_practice ───────────────────────────
console.log('\nInterview questions:');
r = await as('authenticated', A, `insert into public.interview_questions (question, category) values ('Tell me about yourself', 'HR / General') returning id, practice_count, updated_at`);
check('A adds a question', !r.error && r.rows[0].practice_count === 0, show(r));
const qA = r.rows?.[0]?.id;
const qUpdated = r.rows?.[0]?.updated_at;
r = await as('authenticated', A, `insert into public.interview_questions (question, practice_count) values ('x', 99)`);
check('practice_count cannot be inserted by the client', !!r.error);
r = await as('authenticated', A, `update public.interview_questions set practice_count = 50 where id = $1`, [qA]);
check('practice_count cannot be updated by the client', !!r.error);
r = await as('authenticated', A, `select (public.record_practice($1)).practice_count as n`, [qA]);
check('record_practice increments own question', r.rows?.[0]?.n === 1, show(r));
r = await as('authenticated', B, `select (public.record_practice($1)).id as id`, [qA]);
check("record_practice on A's question returns nothing for B", !r.error && r.rows?.[0]?.id === null, show(r));
r = await db.query(`select practice_count from public.interview_questions where id = $1`, [qA]);
check("B's call did not change A's count", r.rows[0].practice_count === 1);
r = await as('anon', null, `select public.record_practice($1)`, [qA]);
check('anon cannot call record_practice', !!r.error);
r = await as('authenticated', A, `update public.interview_questions set notes = 'n' where id = $1 returning updated_at`, [qA]);
check('updated_at bumps on edit', !r.error && new Date(r.rows[0].updated_at) >= new Date(qUpdated));
r = await as('authenticated', B, `update public.interview_questions set notes = 'x' where id = $1`, [qA]);
check("B cannot edit A's question (0 rows)", !r.error && r.affected === 0);
r = await as('authenticated', A, `insert into public.interview_questions (question, category) values ('q', 'Astrology')`);
check('unknown category rejected', !!r.error);

// ── Candidate profiles, settings, profiles ──────────────────────────
console.log('\nProfile, settings:');
r = await as('authenticated', A, `insert into public.candidate_profiles (name, skills, target_roles) values ('A', '{SQL,Python}', '{Data Analyst}') returning user_id`);
check('A saves a candidate profile', !r.error && r.rows[0].user_id === A, show(r));
r = await as('authenticated', B, `select 1 from public.candidate_profiles`);
check("B can't see A's candidate profile", r.rows?.length === 0);
r = await as('authenticated', B, `update public.candidate_profiles set name = 'x' where user_id = $1`, [A]);
check("B can't edit A's candidate profile", !r.error && r.affected === 0);
r = await as('authenticated', A, `insert into public.user_settings (weekly_applications) values (7) on conflict (user_id) do update set weekly_applications = excluded.weekly_applications returning weekly_applications`);
check('A upserts own weekly targets', !r.error && r.rows[0].weekly_applications === 7, show(r));
r = await as('authenticated', B, `update public.user_settings set weekly_applications = 99 where user_id = $1`, [A]);
check("B can't change A's targets", !r.error && r.affected === 0);
r = await as('authenticated', A, `update public.user_settings set weekly_applications = 500 where user_id = $1`, [A]);
check('out-of-range target rejected', !!r.error);
r = await as('authenticated', B, `select id from public.profiles`);
check('B sees only own profile', r.rows?.length === 1 && r.rows[0].id === B);
r = await as('authenticated', A, `update public.profiles set display_name = 'Alfa' where id = $1`, [A]);
check('A renames self', !r.error && r.affected === 1);
r = await as('authenticated', A, `update public.profiles set id = $1 where id = $2`, [B, A]);
check('profile id cannot be changed', !!r.error);

// ── Recommendations ─────────────────────────────────────────────────
console.log('\nRecommendations:');
const rec = `insert into public.recommendations (external_id, dedupe_key, title, company, source) values ('4001', 'data analyst|acme', 'Data Analyst', 'Acme', 'paste')`;
r = await as('authenticated', A, rec);
check('A stores a recommendation', !r.error, show(r));
r = await as('authenticated', A, rec);
check('duplicate for the same user rejected', !!r.error);
r = await as('authenticated', B, rec);
check('the same job is fine for another user', !r.error, show(r));
r = await as('authenticated', A, `update public.recommendations set title = 'x'`);
check('only status is editable', !!r.error);
r = await as('authenticated', B, `update public.recommendations set status = 'dismissed' where user_id = $1`, [A]);
check("B can't dismiss A's recommendation", !r.error && r.affected === 0);
r = await as('authenticated', A, `insert into public.recommendations (external_id, dedupe_key, title, url) values ('9', 'k', 't', 'http://x.com')`);
check('non-https url rejected', !!r.error);

// ── API tokens ──────────────────────────────────────────────────────
console.log('\nAPI tokens:');
r = await as('authenticated', A, `insert into public.api_tokens (name, token_prefix, token_hash) values ('Laptop', 'hst_ab12', $1) returning id, user_id`, [HASH('a')]);
check('A creates a token', !r.error && r.rows[0].user_id === A, show(r));
const tokA = r.rows?.[0]?.id;
r = await as('authenticated', A, `select token_hash from public.api_tokens`);
check('token_hash is never readable by the client', !!r.error, show(r));
r = await as('authenticated', A, `select id, name, token_prefix from public.api_tokens`);
check('A lists own tokens (safe columns)', r.rows?.length === 1);
r = await as('authenticated', B, `select id from public.api_tokens`);
check("B can't see A's tokens", r.rows?.length === 0);
r = await as('authenticated', A, `update public.api_tokens set token_hash = $1 where id = $2`, [HASH('f'), tokA]);
check('token_hash cannot be changed', !!r.error);
r = await as('authenticated', A, `update public.api_tokens set name = 'x' where id = $1`, [tokA]);
check('token name cannot be changed (revoke only)', !!r.error);
r = await as('authenticated', A, `insert into public.api_tokens (name, token_prefix, token_hash, user_id) values ('x', 'hst_zz99', $1, $2)`, [HASH('e'), B]);
check('token for another user rejected', !!r.error);
r = await as('authenticated', A, `insert into public.api_tokens (name, token_prefix, token_hash) values ('x', 'bad', $1)`, [HASH('9')]);
check('malformed prefix rejected', !!r.error);
for (const c of ['b', 'c', 'd', '1']) {
  await as('authenticated', A, `insert into public.api_tokens (name, token_prefix, token_hash) values ('t', 'hst_ab12', $1)`, [HASH(c)]);
}
r = await as('authenticated', A, `insert into public.api_tokens (name, token_prefix, token_hash) values ('sixth', 'hst_ab12', $1)`, [HASH('2')]);
check('6th active token rejected (max 5)', !!r.error, show(r));
r = await as('authenticated', B, `update public.api_tokens set revoked_at = now() where id = $1`, [tokA]);
check("B can't revoke A's token", !r.error && r.affected === 0);
r = await as('authenticated', A, `update public.api_tokens set revoked_at = now() where id = $1`, [tokA]);
check('A revokes own token', !r.error && r.affected === 1);
r = await as('authenticated', A, `insert into public.api_tokens (name, token_prefix, token_hash) values ('new', 'hst_ab12', $1)`, [HASH('3')]);
check('after revoking, a new token fits under the limit', !r.error, show(r));
r = await as('authenticated', A, `update public.api_tokens set revoked_at = null where id = $1`, [tokA]);
check('a revoked token cannot be restored', !!r.error);

// Deleting (0007): own keys only, and only once turned off.
r = await as('authenticated', B, `insert into public.api_tokens (name, token_prefix, token_hash) values ('Old laptop', 'hst_bb22', $1) returning id`, [HASH('8')]);
const tokB = r.rows?.[0]?.id;
r = await as('authenticated', B, `delete from public.api_tokens where id = $1`, [tokB]);
check('an active key cannot be deleted (turn it off first)', !r.error && r.affected === 0, show(r));
await as('authenticated', B, `update public.api_tokens set revoked_at = now() where id = $1`, [tokB]);
r = await as('authenticated', A, `delete from public.api_tokens where id = $1`, [tokB]);
check("A can't delete B's turned-off key", !r.error && r.affected === 0, show(r));
r = await as('authenticated', B, `delete from public.api_tokens where id = $1`, [tokB]);
check('B deletes own turned-off key', !r.error && r.affected === 1, show(r));
r = await as('anon', null, `delete from public.api_tokens`);
check('anon cannot delete keys', !!r.error || r.affected === 0);

r = await as('anon', null, `select public.verify_api_token($1)`, [HASH('b')]);
check('anon cannot call verify_api_token', !!r.error);
r = await as('authenticated', A, `select public.verify_api_token($1)`, [HASH('b')]);
check('authenticated cannot call verify_api_token', !!r.error);
r = await as('service_role', null, `select public.verify_api_token($1) as uid`, [HASH('b')]);
check('service_role resolves an active token to its owner', r.rows?.[0]?.uid === A, show(r));
r = await db.query(`select last_used_at from public.api_tokens where token_hash = $1`, [HASH('b')]);
check('last_used_at stamped', r.rows[0].last_used_at !== null);
r = await as('service_role', null, `select public.verify_api_token($1) as uid`, [HASH('a')]);
check('revoked token resolves to nothing', r.rows?.[0]?.uid === null, show(r));
r = await as('service_role', null, `select public.verify_api_token($1) as uid`, [HASH('0')]);
check('unknown token resolves to nothing', r.rows?.[0]?.uid === null);

// ── Private functions ───────────────────────────────────────────────
console.log('\nPrivate schema:');
for (const fn of ['private.set_updated_at()', 'private.handle_new_user()', 'private.enforce_api_token_rules()']) {
  r = await as('authenticated', A, `select ${fn}`);
  check(`authenticated cannot call ${fn}`, !!r.error);
  r = await as('anon', null, `select ${fn}`);
  check(`anon cannot call ${fn}`, !!r.error);
}
for (const fn of ['private.is_approved()', 'private.is_admin()']) {
  r = await as('anon', null, `select ${fn}`);
  check(`anon cannot call ${fn}`, !!r.error);
}

// ── Storage ─────────────────────────────────────────────────────────
console.log('\nStorage (proofs):');
r = await db.query(`select public, file_size_limit from storage.buckets where id = 'proofs'`);
check('bucket is private with a 4 MB limit', r.rows[0]?.public === false && Number(r.rows[0]?.file_size_limit) === 4194304);
r = await as('authenticated', A, `insert into storage.objects (bucket_id, name) values ('proofs', $1)`, [`${A}/${jobA}/cv.pdf`]);
check('A uploads to own folder', !r.error, show(r));
r = await as('authenticated', A, `insert into storage.objects (bucket_id, name) values ('proofs', $1)`, [`${B}/${jobB}/fake.pdf`]);
check("A cannot upload into B's folder", !!r.error);
r = await as('authenticated', B, `select name from storage.objects where bucket_id = 'proofs'`);
check("B can't list A's files", r.rows?.length === 0);
r = await as('authenticated', B, `delete from storage.objects where name = $1`, [`${A}/${jobA}/cv.pdf`]);
check("B can't delete A's file (0 rows)", !r.error && r.affected === 0);
r = await as('authenticated', A, `update storage.objects set name = $1 where name = $2`, [`${A}/${jobA}/renamed.pdf`, `${A}/${jobA}/cv.pdf`]);
check('files cannot be overwritten/renamed (no update policy)', !r.error && r.affected === 0);
r = await as('anon', null, `select 1 from storage.objects`);
check('anon cannot read storage objects', !!r.error || r.rows?.length === 0);

// ── Admin ───────────────────────────────────────────────────────────
console.log('\nAdmin:');
const ADM = '00000000-0000-0000-0000-0000000000ad';
const P = '00000000-0000-0000-0000-00000000000c';
await db.query(`insert into auth.users (id, email) values ($1, 'admin@example.com'), ($2, 'p@example.com')`, [ADM, P]);
await db.query(`update public.profiles set status = 'approved', is_admin = true where id = $1`, [ADM]);
for (const [sql, params] of [
  ['select * from public.admin_list_users()', []],
  ['select public.admin_set_status($1, $2)', [P, 'approved']],
  ['select public.admin_approve_all_pending()', []],
  ['select public.admin_system_stats()', []],
]) {
  r = await as('authenticated', A, sql, params);
  check(`non-admin cannot ${sql.match(/admin_\w+/)[0]}`, !!r.error, show(r));
  r = await as('anon', null, sql, params);
  check(`anon cannot ${sql.match(/admin_\w+/)[0]}`, !!r.error);
}
r = await as('authenticated', ADM, `select * from public.admin_list_users()`);
check('admin lists every account, pending first', r.rows?.length === 4 && r.rows[0].id === P, show(r));
check('admin list carries no usage data (no application counts)', r.rows && !Object.keys(r.rows[0]).some((k) => /job|count|application/i.test(k)), show(r.rows?.[0]));
r = await as('authenticated', ADM, `select 1 from public.jobs`);
check("admin still can't read other users' jobs", !r.error && r.rows.length === 0, show(r));
r = await as('authenticated', ADM, `select public.admin_set_status($1, 'approved')`, [P]);
check('admin approves a pending user', !r.error, show(r));
r = await as('authenticated', P, `insert into public.jobs (company) values ('P Corp') returning id`);
check('an approved user can add jobs', !r.error, show(r));
await as('authenticated', P, `insert into public.api_tokens (name, token_prefix, token_hash) values ('p', 'hst_pp11', $1)`, [HASH('5')]);
r = await as('service_role', null, `select public.verify_api_token($1) as uid`, [HASH('5')]);
check("an approved user's token works", r.rows?.[0]?.uid === P, show(r));
r = await as('authenticated', ADM, `select public.admin_set_status($1, 'suspended')`, [P]);
check('admin suspends a user', !r.error, show(r));
r = await as('authenticated', P, `select 1 from public.jobs`);
check('a suspended user sees no data', !r.error && r.rows.length === 0, show(r));
r = await db.query(`select count(*)::int as n from public.jobs where user_id = $1`, [P]);
check("suspending keeps the user's data", r.rows[0].n === 1);
r = await as('service_role', null, `select public.verify_api_token($1) as uid`, [HASH('5')]);
check("a suspended user's token resolves to nothing", r.rows?.[0]?.uid === null, show(r));
r = await as('authenticated', ADM, `select public.admin_set_status($1, 'suspended')`, [ADM]);
check('admin cannot change own status', !!r.error);
r = await as('authenticated', ADM, `select public.admin_set_status($1, 'pending')`, [B]);
check('status must be approved or suspended', !!r.error);
await db.query(`insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a2', 'admin2@example.com')`);
await db.query(`update public.profiles set status = 'approved', is_admin = true where id = '00000000-0000-0000-0000-0000000000a2'`);
r = await as('authenticated', ADM, `select public.admin_set_status('00000000-0000-0000-0000-0000000000a2', 'suspended')`);
check('admin cannot suspend another admin', !!r.error);
r = await db.query(`update public.profiles set status = 'suspended' where id = $1`, [ADM]).catch((e) => ({ error: e.message }));
check('an admin row cannot be suspended at all', !!r.error);
await db.query(`insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'e1@example.com'), ('00000000-0000-0000-0000-0000000000e2', 'e2@example.com')`);
r = await as('authenticated', ADM, `select public.admin_approve_all_pending() as n`);
check('approve all approves only pending accounts', r.rows?.[0]?.n === 2, show(r));
r = await db.query(`select status from public.profiles where id = $1`, [P]);
check('approve all leaves suspended accounts suspended', r.rows[0].status === 'suspended');
r = await as('authenticated', ADM, `select public.admin_system_stats() as s`);
const s = r.rows?.[0]?.s;
check('system stats count accounts', s && s.users_total === 7 && s.users_suspended === 1 && s.users_pending === 0, show(r));
check('system stats hold no content totals', s && ['jobs', 'interview_questions', 'recommendations', 'attachments'].every((k) => !(k in s)), show(r));
check('system stats keep capacity figures', s && 'storage_bytes' in s && 'database_bytes' in s && 'active_tokens' in s, show(r));

// ── Admin: access keys ──────────────────────────────────────────────
console.log('\nAdmin access keys:');
const keyB = (await db.query(`select id from public.api_tokens where token_hash = $1`, [HASH('b')])).rows[0].id;
for (const [sql, params] of [
  ['select * from public.admin_list_tokens()', []],
  ['select public.admin_revoke_token($1)', [keyB]],
  ['select public.admin_revoke_user_tokens($1)', [A]],
]) {
  r = await as('authenticated', A, sql, params);
  check(`non-admin cannot ${sql.match(/admin_\w+/)[0]}`, !!r.error, show(r));
  r = await as('anon', null, sql, params);
  check(`anon cannot ${sql.match(/admin_\w+/)[0]}`, !!r.error);
}
r = await as('authenticated', ADM, `select * from public.admin_list_tokens()`);
check("admin lists every account's keys", r.rows?.some((t) => t.user_id === A) && r.rows?.some((t) => t.user_id === P), show(r));
check('admin key list never carries the key hash', r.rows && !Object.keys(r.rows[0]).some((k) => /hash/i.test(k)), show(r.rows?.[0]));
r = await as('authenticated', ADM, `select public.admin_revoke_token($1) as done`, [keyB]);
check("admin turns off another user's key", r.rows?.[0]?.done === true, show(r));
r = await as('service_role', null, `select public.verify_api_token($1) as uid`, [HASH('b')]);
check('a key turned off by the admin stops working', r.rows?.[0]?.uid === null, show(r));
r = await as('authenticated', A, `select revoked_by from public.api_tokens where id = $1`, [keyB]);
check('the owner can see the admin turned it off', r.rows?.[0]?.revoked_by === ADM, show(r));
r = await as('authenticated', A, `update public.api_tokens set revoked_by = null where id = $1`, [keyB]);
check('the owner cannot change revoked_by', !!r.error);
r = await as('authenticated', ADM, `select public.admin_revoke_token($1) as done`, [keyB]);
check('turning off an already-off key reports false', r.rows?.[0]?.done === false, show(r));
r = await as('authenticated', ADM, `select public.admin_revoke_token('00000000-0000-0000-0000-00000000dead')`);
check('turning off an unknown key is an error', !!r.error);
const activeA = (await db.query(`select count(*)::int as n from public.api_tokens where user_id = $1 and revoked_at is null`, [A])).rows[0].n;
r = await as('authenticated', ADM, `select public.admin_revoke_user_tokens($1) as n`, [A]);
check("admin turns off all of an account's keys", activeA > 0 && r.rows?.[0]?.n === activeA, show(r));
r = await db.query(`select count(*)::int as n from public.api_tokens where user_id = $1 and revoked_at is null`, [A]);
check('no active keys left for that account', r.rows[0].n === 0);

// ── Cascades ────────────────────────────────────────────────────────
console.log('\nCascades:');
await as('authenticated', A, `delete from public.jobs where id = $1`, [jobA]);
r = await db.query(`select count(*)::int as n from public.job_attachments where job_id = $1`, [jobA]);
check("deleting a job removes its attachment rows", r.rows[0].n === 0);
await db.query(`delete from auth.users where id = $1`, [A]);
let leftovers = 0;
for (const t of ['jobs', 'job_attachments', 'interview_questions', 'candidate_profiles', 'recommendations', 'api_tokens', 'user_settings']) {
  leftovers += (await db.query(`select count(*)::int as n from public.${t} where user_id = $1`, [A])).rows[0].n;
}
leftovers += (await db.query(`select count(*)::int as n from public.profiles where id = $1`, [A])).rows[0].n;
check('deleting an account removes all of its rows', leftovers === 0, String(leftovers));
r = await db.query(`select count(*)::int as n from public.recommendations where user_id = $1`, [B]);
check("B's data is untouched", r.rows[0].n === 1);

console.log(`\nResult: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
