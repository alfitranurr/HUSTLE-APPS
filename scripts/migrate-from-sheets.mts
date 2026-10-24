/**
 * One-time move of the owner's data from the Google Sheet (+ Drive proofs) into
 * their Supabase account. Reads Google only; never changes the Sheet or Drive.
 *
 *   npx tsx --env-file=.env.local scripts/migrate-from-sheets.mts --email you@example.com          # dry run
 *   npx tsx --env-file=.env.local scripts/migrate-from-sheets.mts --email you@example.com --apply  # write
 *
 * Idempotent: jobs/interviews are keyed by (user_id, legacy_id), recommendations
 * by (user_id, external_id), files by a path built from the Drive file id.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { google, type drive_v3 } from 'googleapis';
import {
  dedupeLegacyIds,
  jobColumnIndex,
  JOB_COLUMNS,
  mapJobRow,
  mapProfile,
  mapQuestionRow,
  mapRecommendationRow,
  mapSettings,
  type MappedJob,
} from './migrate/legacy.ts';

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const BUCKET = 'proofs';

// --- arguments + env ---------------------------------------------------------------

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const email = args[args.indexOf('--email') + 1]?.toLowerCase();
if (!args.includes('--email') || !email || email.startsWith('--')) {
  console.error('Usage: scripts/migrate-from-sheets.mts --email <account email> [--apply]');
  process.exit(1);
}

function env(name: string, required = true) {
  const value = process.env[name]?.trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
  if (required && !value) throw new Error(`${name} is not set`);
  return value ?? '';
}

// --- Google (read-only) --------------------------------------------------------------

/** Every Google credential in the env: the owner's OAuth token and/or the service account. */
function googleAuths() {
  const auths = [];
  const id = env('GOOGLE_CLIENT_ID', false);
  const secret = env('GOOGLE_CLIENT_SECRET', false);
  const refresh = env('GOOGLE_REFRESH_TOKEN', false);
  if (id && secret && refresh) {
    const oauth = new google.auth.OAuth2(id, secret);
    oauth.setCredentials({ refresh_token: refresh });
    auths.push(oauth);
  }
  const key = env('GOOGLE_SERVICE_ACCOUNT_KEY', false);
  if (key) {
    const { client_email, private_key } = JSON.parse(key) as { client_email: string; private_key: string };
    auths.push(
      new google.auth.JWT({
        email: client_email,
        key: private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.readonly'],
      })
    );
  }
  if (auths.length === 0) throw new Error('No Google credentials in the env');
  return auths;
}

const auths = googleAuths();
const sheets = google.sheets({ version: 'v4', auth: auths[0] });
// Some old proofs are only visible to one of the two credentials, so files try each in turn.
const drives = auths.map((auth) => google.drive({ version: 'v3', auth }));
const spreadsheetId = env('GOOGLE_SHEET_ID');

async function readTab(range: string): Promise<string[][]> {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return (res.data.values ?? []).map((row) => row.map((cell) => (cell == null ? '' : String(cell).trim())));
  } catch (error) {
    if (String((error as Error).message).includes('Unable to parse range')) return []; // tab doesn't exist
    throw error;
  }
}

const keyValues = (rows: string[][]) => new Map(rows.filter(([k]) => k).map(([k, v]) => [k, v ?? '']));

// --- read + map --------------------------------------------------------------------------

const issues: string[] = [];
const report = { add: (m: string) => issues.push(m) };

const [jobValues, questionValues, recValues, profileValues, settingValues] = await Promise.all([
  readTab(`DataLowongan!A:Z`),
  readTab('Interviews!A2:M'),
  readTab('Recommendations!A2:H'),
  readTab('Profile!A2:B'),
  readTab('Settings!A2:B'),
]);

const [header = [], ...jobRows] = jobValues;
const index = jobColumnIndex(header);
const jobs = dedupeLegacyIds(
  jobRows
    .map((cells, i) => mapJobRow((c) => cells[index.get(c)!] ?? '', i + 2, report))
    .filter((j): j is MappedJob => j !== null),
  report
);
const skippedJobRows = jobRows.length - jobs.length;

const questions = questionValues
  .map((cells, i) => mapQuestionRow(cells, i + 2, report))
  .filter((q): q is NonNullable<typeof q> => q !== null);
{
  const seen = new Set<string>();
  for (const q of questions) {
    while (seen.has(q.legacy_id)) q.legacy_id = `${q.legacy_id}-dup`;
    seen.add(q.legacy_id);
  }
}

const recommendations: NonNullable<ReturnType<typeof mapRecommendationRow>>[] = [];
{
  const ids = new Set<string>();
  const keys = new Set<string>();
  recValues.forEach((cells, i) => {
    const rec = mapRecommendationRow(cells, i + 2, report);
    if (!rec) return;
    if (ids.has(rec.external_id) || keys.has(rec.dedupe_key)) {
      report.add(`Recommendations row ${i + 2}: duplicate of an earlier row, skipped`);
      return;
    }
    ids.add(rec.external_id);
    keys.add(rec.dedupe_key);
    recommendations.push(rec);
  });
}

const profile = mapProfile(keyValues(profileValues));
const settings = mapSettings(keyValues(settingValues));

// --- Drive metadata (read-only) ------------------------------------------------------

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  /** Which credential could read it. */
  drive: drive_v3.Drive;
}
const driveMeta = new Map<string, DriveFile | { error: string }>();
const allFileIds = [...new Set(jobs.flatMap((j) => j.driveFiles))];
for (let i = 0; i < allFileIds.length; i += 8) {
  await Promise.all(
    allFileIds.slice(i, i + 8).map(async (id) => {
      let lastError = 'error';
      for (const drive of drives) {
        try {
          const res = await drive.files.get({ fileId: id, fields: 'id,name,mimeType,size,trashed', supportsAllDrives: true });
          const f = res.data as drive_v3.Schema$File;
          if (f.trashed) driveMeta.set(id, { error: 'in Drive trash' });
          else if (!ALLOWED_MIME.includes(f.mimeType ?? '')) driveMeta.set(id, { error: `type ${f.mimeType} not allowed` });
          else if (Number(f.size ?? 0) > MAX_FILE_BYTES) driveMeta.set(id, { error: `larger than 4 MB (${(Number(f.size) / 1048576).toFixed(1)} MB)` });
          else driveMeta.set(id, { id, name: f.name ?? id, mimeType: f.mimeType!, size: Number(f.size ?? 0), drive });
          return;
        } catch (error) {
          lastError = String((error as { code?: number }).code ?? 'error');
        }
      }
      driveMeta.set(id, { error: `not readable by any credential (${lastError})` });
    })
  );
}
const okFiles = [...driveMeta.values()].filter((m): m is DriveFile => 'id' in m);
const badFiles = [...driveMeta.entries()].filter(([, m]) => 'error' in m) as [string, { error: string }][];

// --- report ----------------------------------------------------------------------------

const tally = <T extends string>(values: T[]) =>
  Object.fromEntries([...values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>())].sort());

console.log(`\n=== ${apply ? 'APPLY' : 'DRY RUN'}: Google Sheet → Supabase (${email}) ===\n`);
console.log('Sheet rows read:');
console.log(`  DataLowongan     ${jobRows.length} rows → ${jobs.length} applications (${skippedJobRows} skipped: no company)`);
console.log(`  Interviews       ${questionValues.length} rows → ${questions.length} questions`);
console.log(`  Recommendations  ${recValues.length} rows → ${recommendations.length} recommendations`);
console.log(`  Profile          ${profile ? 'yes' : 'none'}`);
console.log(`  Settings         weekly targets ${settings.weekly_applications} applications / ${settings.weekly_interviews} interviews`);
console.log('\nStatus:', tally(jobs.map((j) => j.row.status)));
console.log('Stage: ', tally(jobs.map((j) => j.row.stage)));
console.log(`\nProof files: ${allFileIds.length} Drive files on ${jobs.filter((j) => j.driveFiles.length).length} applications`);
console.log(`  copyable ${okFiles.length} (${(okFiles.reduce((s, f) => s + f.size, 0) / 1048576).toFixed(1)} MB), problems ${badFiles.length}`);
for (const [id, { error }] of badFiles) {
  const owner = jobs.find((j) => j.driveFiles.includes(id));
  console.log(`  ✘ ${owner?.row.company ?? '?'} · file ${id}: ${error}`);
}
// "Indonesia" → "InIn Progresssia" looks like an old find/replace in the Sheet. Reported, migrated as is.
const damaged = jobs.filter((j) => /In Progress/.test(`${j.row.company} ${j.row.position} ${j.row.note}`));
console.log(`\nText containing "In Progress" (possible old find/replace damage): ${damaged.length}`);
for (const j of damaged) console.log(`  · ${j.row.legacy_id} | ${j.row.company} | ${j.row.position}`);
console.log(`\nAdjustments (${issues.length}):`);
for (const issue of issues) console.log(`  · ${issue}`);
console.log('\nSample mappings:');
// Five evenly spaced rows, so old and new layouts both show up.
const step = Math.max(1, Math.floor(jobs.length / 5));
for (const j of jobs.filter((_, i) => i % step === 0).slice(0, 5)) {
  const { legacy_id, company, position, applied_at, status, stage, platform, stage_dates } = j.row;
  console.log(`  ${legacy_id} | ${company} | ${position} | applied ${applied_at} | ${status} / ${stage} | ${platform} | stages ${JSON.stringify(stage_dates)} | files ${j.driveFiles.length}`);
}

if (!apply) {
  console.log('\nDry run only: nothing was written. Re-run with --apply to migrate.\n');
  process.exit(0);
}

// --- write -------------------------------------------------------------------------------

const db: SupabaseClient = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUser(): Promise<string> {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) {
      if (!user.email_confirmed_at) throw new Error(`${email} has not confirmed its email`);
      return user.id;
    }
    if (data.users.length < 200) throw new Error(`No account for ${email}`);
  }
}

const check = <T>(label: string, res: { data: T; error: { message: string } | null }) => {
  if (res.error) throw new Error(`${label}: ${res.error.message}`);
  return res.data;
};

const userId = await findUser();
console.log(`\nWriting to account ${userId} …`);

// Applications
for (let i = 0; i < jobs.length; i += 100) {
  check(
    'jobs',
    await db.from('jobs').upsert(
      jobs.slice(i, i + 100).map((j) => ({ ...j.row, user_id: userId })),
      { onConflict: 'user_id,legacy_id' }
    )
  );
}
const idRows = check('job ids', await db.from('jobs').select('id, legacy_id').eq('user_id', userId)) as { id: string; legacy_id: string | null }[];
const jobIdByLegacy = new Map(idRows.map((r) => [r.legacy_id, r.id]));
console.log(`  applications upserted: ${jobs.length}`);

// Proof files: Drive → Storage (skips files already copied)
const existingPaths = new Set(
  (check('attachments', await db.from('job_attachments').select('storage_path').eq('user_id', userId)) as { storage_path: string }[]).map(
    (r) => r.storage_path
  )
);
let copied = 0;
for (const job of jobs) {
  const jobId = jobIdByLegacy.get(job.row.legacy_id)!;
  for (const fileId of job.driveFiles) {
    const meta = driveMeta.get(fileId);
    if (!meta || !('id' in meta)) continue;
    const safeName = meta.name.replace(/[^\w.\- ()]/g, '_').slice(0, 120) || fileId;
    const path = `${userId}/${jobId}/${fileId.slice(0, 12)}-${safeName}`.slice(0, 400);
    if (existingPaths.has(path)) continue;
    const res = await meta.drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data as ArrayBuffer);
    const up = await db.storage.from(BUCKET).upload(path, buffer, { contentType: meta.mimeType, upsert: true });
    if (up.error) throw new Error(`upload ${safeName}: ${up.error.message}`);
    check(
      'attachment row',
      await db.from('job_attachments').insert({
        user_id: userId,
        job_id: jobId,
        storage_path: path,
        file_name: safeName,
        mime_type: meta.mimeType,
        size_bytes: buffer.length,
      })
    );
    copied++;
  }
}
console.log(`  proof files copied: ${copied} (already there: ${existingPaths.size})`);

// Interview questions
if (questions.length) {
  check('interviews', await db.from('interview_questions').upsert(questions.map((q) => ({ ...q, user_id: userId })), { onConflict: 'user_id,legacy_id' }));
}
console.log(`  interview questions upserted: ${questions.length}`);

// Recommendations (skip ones the account already has, by id or by title+company)
const have = check('recommendations', await db.from('recommendations').select('external_id, dedupe_key').eq('user_id', userId)) as {
  external_id: string;
  dedupe_key: string;
}[];
const haveIds = new Set(have.map((r) => r.external_id));
const haveKeys = new Set(have.map((r) => r.dedupe_key));
const freshRecs = recommendations.filter((r) => !haveIds.has(r.external_id) && !haveKeys.has(r.dedupe_key));
for (let i = 0; i < freshRecs.length; i += 200) {
  check('recommendations insert', await db.from('recommendations').insert(freshRecs.slice(i, i + 200).map((r) => ({ ...r, user_id: userId }))));
}
console.log(`  recommendations added: ${freshRecs.length} (already there: ${recommendations.length - freshRecs.length})`);

if (profile) check('profile', await db.from('candidate_profiles').upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' }));
check('settings', await db.from('user_settings').upsert({ ...settings, user_id: userId }, { onConflict: 'user_id' }));
console.log(`  profile: ${profile ? 'saved' : 'none'} · weekly targets saved`);

// --- verify ------------------------------------------------------------------------------

const count = async (table: string) =>
  (await db.from(table).select('*', { count: 'exact', head: true }).eq('user_id', userId)).count ?? -1;
const dbJobs = check('verify', await db.from('jobs').select('legacy_id, status, stage').eq('user_id', userId).not('legacy_id', 'is', null)) as {
  legacy_id: string;
  status: string;
  stage: string;
}[];
const migrated = dbJobs.filter((r) => jobs.some((j) => j.row.legacy_id === r.legacy_id));
const same = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);
const expectedFiles = jobs.reduce((n, j) => n + j.driveFiles.filter((id) => driveMeta.get(id) && 'id' in driveMeta.get(id)!).length, 0);

console.log('\nVerification:');
console.log(`  applications   sheet ${jobs.length} · database ${migrated.length} ${migrated.length === jobs.length ? '✔' : '✘'}`);
console.log(`  status mix     ${same(tally(migrated.map((r) => r.status)), tally(jobs.map((j) => j.row.status))) ? '✔ identical' : '✘ differs'}`);
console.log(`  stage mix      ${same(tally(migrated.map((r) => r.stage)), tally(jobs.map((j) => j.row.stage))) ? '✔ identical' : '✘ differs'}`);
console.log(`  proof files    copyable ${expectedFiles} · database ${await count('job_attachments')}`);
console.log(`  interviews     sheet ${questions.length} · database ${await count('interview_questions')}`);
console.log(`  recommendations sheet ${recommendations.length} · database ${await count('recommendations')}`);
console.log(`  profile        ${await count('candidate_profiles')} row(s)\n`);
