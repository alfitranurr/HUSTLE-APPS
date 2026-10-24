-- ════════════════════════════════════════════════════════════════════
-- 0001_core.sql: Hustle multi-user schema, per-user isolation with RLS
--
-- Every data table carries user_id (default auth.uid()) and four policies
-- `to authenticated` that compare it with (select auth.uid()). anon gets
-- nothing. Privileges are revoked first (Supabase grants everything to
-- anon/authenticated by default) and re-granted per column, so a client can
-- never write user_id, ids, counters or timestamps it doesn't own.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- Private schema: helpers that must not be reachable through the Data API
-- ────────────────────────────────────────────────────────────────────
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────────

-- One row per account, created by private.handle_new_user().
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.user_settings (
  user_id             uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  weekly_applications integer not null default 5 check (weekly_applications between 0 and 100),
  weekly_interviews   integer not null default 2 check (weekly_interviews between 0 and 50),
  updated_at          timestamptz not null default now()
);

-- Job applications. updated_at is the app's "Last updated" (follow-up
-- clock), so the app sets it; no trigger, because some updates must keep it.
create table public.jobs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  legacy_id     text check (legacy_id is null or char_length(legacy_id) <= 100),
  company       text not null check (char_length(company) between 1 and 200),
  position      text not null default '' check (char_length(position) <= 200),
  applied_at    timestamptz not null default now(),
  scheduled_at  timestamptz,
  contract_date date,
  stage_dates   jsonb not null default '{}'::jsonb check (jsonb_typeof(stage_dates) = 'object'),
  status        text not null default 'In Progress'
                check (status in ('Not Started', 'In Progress', 'Success', 'Failed', 'No Response')),
  stage         text not null default 'Not Started'
                check (stage in ('Not Started', 'Document Screening', 'Assessment Test', 'HR Interview',
                                 'User Interview', 'FGD/LGD', 'Offering Letter', 'Contract Signed / Done')),
  platform      text not null default '' check (char_length(platform) <= 80),
  career_level  text not null default '' check (char_length(career_level) <= 80),
  province      text not null default '' check (char_length(province) <= 120),
  city          text not null default '' check (char_length(city) <= 120),
  note          text not null default '' check (char_length(note) <= 5000),
  link_instagram text not null default '' check (char_length(link_instagram) <= 2048 and (link_instagram = '' or link_instagram ~* '^https?://')),
  link_linkedin  text not null default '' check (char_length(link_linkedin) <= 2048 and (link_linkedin = '' or link_linkedin ~* '^https?://')),
  link_website   text not null default '' check (char_length(link_website) <= 2048 and (link_website = '' or link_website ~* '^https?://')),
  link_other     text not null default '' check (char_length(link_other) <= 2048 and (link_other = '' or link_other ~* '^https?://')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Lets job_attachments reference (job, owner) so a file can't hang off someone else's job.
  unique (id, user_id),
  unique (user_id, legacy_id)
);

create index jobs_user_applied_idx on public.jobs (user_id, applied_at desc);

-- Proof files in the private "proofs" bucket at {user_id}/{job_id}/{file}.
create table public.job_attachments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  job_id       uuid not null,
  storage_path text not null unique check (char_length(storage_path) <= 400),
  file_name    text not null check (char_length(file_name) between 1 and 200),
  mime_type    text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')),
  size_bytes   integer not null check (size_bytes between 1 and 4194304),
  created_at   timestamptz not null default now(),
  foreign key (job_id, user_id) references public.jobs (id, user_id) on delete cascade,
  -- The path must sit in the owner's folder for this job.
  check (split_part(storage_path, '/', 1) = user_id::text and split_part(storage_path, '/', 2) = job_id::text)
);

create index job_attachments_job_idx on public.job_attachments (job_id);

create table public.interview_questions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  legacy_id         text check (legacy_id is null or char_length(legacy_id) <= 100),
  category          text not null default 'Behavioral'
                    check (category in ('Behavioral', 'Technical', 'HR / General', 'Assessment / Test',
                                        'System Design', 'Leadership', 'Salary & Culture')),
  question          text not null check (char_length(question) between 1 and 1000),
  situation         text not null default '' check (char_length(situation) <= 3000),
  task              text not null default '' check (char_length(task) <= 3000),
  action            text not null default '' check (char_length(action) <= 3000),
  result            text not null default '' check (char_length(result) <= 3000),
  target_company    text not null default '' check (char_length(target_company) <= 200),
  difficulty        text not null default 'Medium' check (difficulty in ('Easy', 'Medium', 'Hard')),
  status            text not null default 'Practice Needed' check (status in ('Practice Needed', 'Mastered')),
  notes             text not null default '' check (char_length(notes) <= 3000),
  practice_count    integer not null default 0 check (practice_count >= 0),
  last_practiced_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, legacy_id)
);

create index interview_questions_user_idx on public.interview_questions (user_id, created_at);

-- Job match profile (from LinkedIn's "Save to PDF", then edited). One row per user.
create table public.candidate_profiles (
  user_id             uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name                text not null default '' check (char_length(name) <= 200),
  headline            text not null default '' check (char_length(headline) <= 300),
  location            text not null default '' check (char_length(location) <= 200),
  skills              text[] not null default '{}' check (cardinality(skills) <= 80),
  titles              text[] not null default '{}' check (cardinality(titles) <= 30),
  education           text[] not null default '{}' check (cardinality(education) <= 10),
  target_roles        text[] not null default '{}' check (cardinality(target_roles) <= 15),
  preferred_locations text[] not null default '{}' check (cardinality(preferred_locations) <= 15),
  keywords            text[] not null default '{}' check (cardinality(keywords) <= 40),
  exclude_keywords    text[] not null default '{}' check (cardinality(exclude_keywords) <= 40),
  years_experience    numeric(4, 1) check (years_experience is null or years_experience between 0 and 60),
  parsed_at           timestamptz,
  updated_at          timestamptz not null default now()
);

-- Jobs LinkedIn recommended (pasted "Top job picks" page).
create table public.recommendations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text not null check (char_length(external_id) between 1 and 100),
  dedupe_key  text not null check (char_length(dedupe_key) between 1 and 600),
  title       text not null check (char_length(title) between 1 and 300),
  company     text not null default '' check (char_length(company) <= 300),
  location    text not null default '' check (char_length(location) <= 200),
  url         text not null default '' check (char_length(url) <= 2048 and (url = '' or url ~* '^https://')),
  source      text not null default 'paste' check (source in ('email', 'paste')),
  received_at timestamptz not null default now(),
  status      text not null default 'new' check (status in ('new', 'added', 'dismissed')),
  created_at  timestamptz not null default now(),
  unique (user_id, external_id),
  unique (user_id, dedupe_key)
);

create index recommendations_user_idx on public.recommendations (user_id, received_at desc);

-- ────────────────────────────────────────────────────────────────────
-- Triggers
-- ────────────────────────────────────────────────────────────────────
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function private.set_updated_at();

create trigger interview_questions_set_updated_at
  before update on public.interview_questions
  for each row execute function private.set_updated_at();

create trigger candidate_profiles_set_updated_at
  before update on public.candidate_profiles
  for each row execute function private.set_updated_at();

-- New account: profile + default settings.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''), 80)
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ────────────────────────────────────────────────────────────────────
-- RPC: one practice round, atomic. Security definer because practice_count
-- is not client-writable; it only ever touches the caller's own row.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.record_practice(question_id uuid)
returns public.interview_questions
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  updated public.interview_questions;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.interview_questions
  set practice_count = practice_count + 1,
      last_practiced_at = now()
  where id = question_id
    and user_id = uid
  returning * into updated;

  return updated; -- null when the question isn't the caller's
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- Privileges: start from nothing, then grant per column
-- ────────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

revoke all on public.profiles, public.user_settings, public.jobs, public.job_attachments,
              public.interview_questions, public.candidate_profiles, public.recommendations
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select on public.user_settings to authenticated;
grant insert (weekly_applications, weekly_interviews) on public.user_settings to authenticated;
grant update (weekly_applications, weekly_interviews) on public.user_settings to authenticated;

grant select, delete on public.jobs to authenticated;
grant insert (company, position, applied_at, scheduled_at, contract_date, stage_dates, status, stage,
              platform, career_level, province, city, note,
              link_instagram, link_linkedin, link_website, link_other, updated_at)
  on public.jobs to authenticated;
grant update (company, position, applied_at, scheduled_at, contract_date, stage_dates, status, stage,
              platform, career_level, province, city, note,
              link_instagram, link_linkedin, link_website, link_other, updated_at)
  on public.jobs to authenticated;

grant select, delete on public.job_attachments to authenticated;
grant insert (job_id, storage_path, file_name, mime_type, size_bytes) on public.job_attachments to authenticated;

grant select, delete on public.interview_questions to authenticated;
grant insert (category, question, situation, task, action, result, target_company, difficulty, status, notes)
  on public.interview_questions to authenticated;
grant update (category, question, situation, task, action, result, target_company, difficulty, status, notes)
  on public.interview_questions to authenticated;

grant select, delete on public.candidate_profiles to authenticated;
grant insert (name, headline, location, skills, titles, education, target_roles, preferred_locations,
              keywords, exclude_keywords, years_experience, parsed_at)
  on public.candidate_profiles to authenticated;
grant update (name, headline, location, skills, titles, education, target_roles, preferred_locations,
              keywords, exclude_keywords, years_experience, parsed_at)
  on public.candidate_profiles to authenticated;

grant select, delete on public.recommendations to authenticated;
grant insert (external_id, dedupe_key, title, company, location, url, source, received_at, status)
  on public.recommendations to authenticated;
grant update (status) on public.recommendations to authenticated;

revoke execute on function public.record_practice(uuid) from public, anon;
grant execute on function public.record_practice(uuid) to authenticated;

revoke execute on function private.set_updated_at() from public, anon, authenticated;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

-- ────────────────────────────────────────────────────────────────────
-- Row Level Security: own rows only
-- ────────────────────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.user_settings       enable row level security;
alter table public.jobs                enable row level security;
alter table public.job_attachments     enable row level security;
alter table public.interview_questions enable row level security;
alter table public.candidate_profiles  enable row level security;
alter table public.recommendations     enable row level security;

-- profiles (id is the user id; rows are created by the signup trigger only)
create policy "profiles: read own" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_settings
create policy "user_settings: read own" on public.user_settings for select to authenticated
  using (user_id = (select auth.uid()));
create policy "user_settings: insert own" on public.user_settings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "user_settings: update own" on public.user_settings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- jobs
create policy "jobs: read own" on public.jobs for select to authenticated
  using (user_id = (select auth.uid()));
create policy "jobs: insert own" on public.jobs for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "jobs: update own" on public.jobs for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "jobs: delete own" on public.jobs for delete to authenticated
  using (user_id = (select auth.uid()));

-- job_attachments (no update: files are added or removed, never re-pointed)
create policy "job_attachments: read own" on public.job_attachments for select to authenticated
  using (user_id = (select auth.uid()));
create policy "job_attachments: insert own" on public.job_attachments for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "job_attachments: delete own" on public.job_attachments for delete to authenticated
  using (user_id = (select auth.uid()));

-- interview_questions
create policy "interview_questions: read own" on public.interview_questions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "interview_questions: insert own" on public.interview_questions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "interview_questions: update own" on public.interview_questions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "interview_questions: delete own" on public.interview_questions for delete to authenticated
  using (user_id = (select auth.uid()));

-- candidate_profiles
create policy "candidate_profiles: read own" on public.candidate_profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy "candidate_profiles: insert own" on public.candidate_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "candidate_profiles: update own" on public.candidate_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "candidate_profiles: delete own" on public.candidate_profiles for delete to authenticated
  using (user_id = (select auth.uid()));

-- recommendations
create policy "recommendations: read own" on public.recommendations for select to authenticated
  using (user_id = (select auth.uid()));
create policy "recommendations: insert own" on public.recommendations for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "recommendations: update own" on public.recommendations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "recommendations: delete own" on public.recommendations for delete to authenticated
  using (user_id = (select auth.uid()));
