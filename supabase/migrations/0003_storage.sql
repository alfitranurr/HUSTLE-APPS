-- ════════════════════════════════════════════════════════════════════
-- 0003_storage.sql: private "proofs" bucket for application proof files
-- Path: {user_id}/{job_id}/{file}. Files are opened through signed URLs
-- created with the user's own client, so these policies always apply.
-- ════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs',
  'proofs',
  false,                      -- never public
  4194304,                    -- 4 MB per file (Vercel request limit is 4.5 MB)
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Own folder only. No update policy: files are uploaded or deleted, never overwritten.
create policy "proofs: read own folder"
  on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "proofs: upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "proofs: delete own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);
