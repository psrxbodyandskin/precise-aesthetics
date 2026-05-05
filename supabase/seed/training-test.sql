-- ============================================================
-- Precise Aesthetics — Training Test Seed (P9 E2E test data)
-- ============================================================
-- Creates a published Pico curriculum with 2 short modules so
-- the admin + portal training surfaces have something to render
-- without manually clicking through "+ New curriculum / + New
-- module / publish / publish".
--
-- Idempotent: safe to re-run. Looks up Pico by slug; ON CONFLICT
-- protects against the unique(device_id) on curricula and unique
-- slug on modules.
--
-- Modules ship with NO video uploaded — the storage bucket
-- doesn't have a placeholder, and the Vercel body limit prevents
-- proxying. Upload a short MP4 from the admin module detail
-- page after running this. Public-domain options under 100 MB:
--   • Sintel trailer  (~5 MB, 52s)
--     https://www.w3.org/2010/05/sintel/trailer.mp4
--   • Big Buck Bunny  (~6 MB, 10s clip)
--     https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Resolve Pico device id (seeded by 0005_practices.sql)
-- ------------------------------------------------------------
do $$
declare
  v_device_id uuid;
  v_curriculum_id uuid;
  v_module_1_id uuid;
  v_module_2_id uuid;
begin
  select id into v_device_id
  from public.devices
  where slug = 'precise-pico'
  limit 1;

  if v_device_id is null then
    raise exception 'Precise Pico device not found. Run 0005_practices.sql first.';
  end if;

  -- ----------------------------------------------------------
  -- 2. Curriculum (one per device — UNIQUE on device_id)
  -- ----------------------------------------------------------
  insert into public.training_curricula (
    device_id, title, description, status, published_at
  )
  values (
    v_device_id,
    'Precise Pico™ Training Curriculum',
    'Master the protocols, parameter envelopes, and biologic control for the Precise Pico system. Required for treatment logging.',
    'published',
    now()
  )
  on conflict (device_id) do update set
    title = excluded.title,
    description = excluded.description,
    status = 'published',
    published_at = coalesce(public.training_curricula.published_at, now()),
    updated_at = now()
  returning id into v_curriculum_id;

  -- ----------------------------------------------------------
  -- 3. Modules (slug is unique — re-runnable)
  -- ----------------------------------------------------------
  insert into public.training_modules (
    title, slug, description, required_watch_percentage,
    status, published_at
  )
  values (
    'Welcome to the Precise Pico™',
    'welcome-precise-pico',
    'Orientation to the device, biologic control philosophy, and what the rest of this curriculum covers.',
    50,
    'published',
    now()
  )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    status = 'published',
    published_at = coalesce(public.training_modules.published_at, now()),
    updated_at = now()
  returning id into v_module_1_id;

  insert into public.training_modules (
    title, slug, description, required_watch_percentage,
    status, published_at
  )
  values (
    'Parameter envelopes & treatment endpoints',
    'parameter-envelopes-endpoints',
    'How fluence, spot size, and pulse duration combine. Reading clinical endpoints in real time.',
    50,
    'published',
    now()
  )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    status = 'published',
    published_at = coalesce(public.training_modules.published_at, now()),
    updated_at = now()
  returning id into v_module_2_id;

  -- ----------------------------------------------------------
  -- 4. Curriculum membership (M:N + ordering)
  -- ----------------------------------------------------------
  insert into public.curriculum_modules (
    curriculum_id, module_id, sort_order, is_required
  )
  values
    (v_curriculum_id, v_module_1_id, 1, true),
    (v_curriculum_id, v_module_2_id, 2, true)
  on conflict (curriculum_id, module_id) do update set
    sort_order = excluded.sort_order,
    is_required = excluded.is_required;

  raise notice 'Pico curriculum: %', v_curriculum_id;
  raise notice 'Module 1 (welcome): %', v_module_1_id;
  raise notice 'Module 2 (parameters): %', v_module_2_id;
end $$;
