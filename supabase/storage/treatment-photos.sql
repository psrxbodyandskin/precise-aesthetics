-- ============================================================
-- Precise Aesthetics — treatment-photos Supabase Storage bucket
-- ============================================================
-- Run AFTER 0008_treatments.sql. Bucket creation + storage RLS
-- can't live inside a regular migration because the storage schema
-- requires storage-admin privileges; run this manually in the
-- Supabase SQL editor as the project owner.
--
-- Path scheme: {practice_id}/{treatment_id}/{uuid}-{filename}
-- The first folder segment is the security boundary. Storage RLS
-- compares (storage.foldername(name))[1] against the JWT
-- current_practice_id() claim. If the path doesn't start with the
-- caller's practice_id, the upload is denied at the storage layer.
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================

-- 1. Create the bucket (private — no public access)
insert into storage.buckets (id, name, public)
values ('treatment-photos', 'treatment-photos', false)
on conflict (id) do nothing;

-- 2. RLS — practice can upload to their own practice_id folder
create policy "treatment_photos practice upload own"
on storage.objects for insert
with check (
  bucket_id = 'treatment-photos'
  and public.is_practice()
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

-- 3. RLS — practice can read their own photos; admin can read all
create policy "treatment_photos read own or admin"
on storage.objects for select
using (
  bucket_id = 'treatment-photos'
  and (
    public.is_admin()
    or (
      public.is_practice()
      and (storage.foldername(name))[1] = public.current_practice_id()::text
    )
  )
);

-- 4. RLS — practice can delete their own photos
create policy "treatment_photos practice delete own"
on storage.objects for delete
using (
  bucket_id = 'treatment-photos'
  and public.is_practice()
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

-- 5. RLS — admin can delete (rare, for support/cleanup)
create policy "treatment_photos admin delete"
on storage.objects for delete
using (
  bucket_id = 'treatment-photos'
  and public.is_admin()
);
