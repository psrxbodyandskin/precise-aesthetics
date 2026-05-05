-- ============================================================
-- Precise Aesthetics — Training Storage Buckets (P9)
-- ============================================================
-- Run AFTER 0011_training.sql. Two private buckets:
--
--   training-videos    — admin-uploaded MP4/WebM/MOV, up to 5GB.
--                        Direct browser upload via Supabase JS
--                        client (Vercel body limit forbids
--                        proxying — admin client uses session
--                        token; bucket RLS enforces is_admin()).
--   training-materials — admin-uploaded PDF/PNG/JPG/ZIP,
--                        up to 100MB.
--
-- Read access: ANY authenticated user (admin or practice).
-- Curriculum-level RLS handles device-ownership gating before
-- a practice ever asks for a video URL — the storage policy is
-- the second line of defence, not the first.
--
-- Storage objects can't be created by admins through plain SQL
-- without storage-admin privileges; run this manually in the
-- Supabase SQL editor as project owner.
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Buckets
-- ------------------------------------------------------------
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'training-videos',
  'training-videos',
  false,
  5368709120,  -- 5 GiB per file
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'training-materials',
  'training-materials',
  false,
  104857600,   -- 100 MiB per file
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/zip'
  ]
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2. training-videos policies (4)
-- ------------------------------------------------------------
drop policy if exists "training_videos admin insert" on storage.objects;
create policy "training_videos admin insert"
on storage.objects for insert
with check (
  bucket_id = 'training-videos'
  and public.is_admin()
);

drop policy if exists "training_videos auth read" on storage.objects;
create policy "training_videos auth read"
on storage.objects for select
using (
  bucket_id = 'training-videos'
  and (public.is_admin() or public.is_practice())
);

drop policy if exists "training_videos admin update" on storage.objects;
create policy "training_videos admin update"
on storage.objects for update
using (
  bucket_id = 'training-videos'
  and public.is_admin()
);

drop policy if exists "training_videos admin delete" on storage.objects;
create policy "training_videos admin delete"
on storage.objects for delete
using (
  bucket_id = 'training-videos'
  and public.is_admin()
);

-- ------------------------------------------------------------
-- 3. training-materials policies (4)
-- ------------------------------------------------------------
drop policy if exists "training_materials admin insert" on storage.objects;
create policy "training_materials admin insert"
on storage.objects for insert
with check (
  bucket_id = 'training-materials'
  and public.is_admin()
);

drop policy if exists "training_materials auth read" on storage.objects;
create policy "training_materials auth read"
on storage.objects for select
using (
  bucket_id = 'training-materials'
  and (public.is_admin() or public.is_practice())
);

drop policy if exists "training_materials admin update" on storage.objects;
create policy "training_materials admin update"
on storage.objects for update
using (
  bucket_id = 'training-materials'
  and public.is_admin()
);

drop policy if exists "training_materials admin delete" on storage.objects;
create policy "training_materials admin delete"
on storage.objects for delete
using (
  bucket_id = 'training-materials'
  and public.is_admin()
);
