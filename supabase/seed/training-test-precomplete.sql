-- ============================================================
-- Precise Aesthetics — Pre-Completed Training (P9 cert flow test)
-- ============================================================
-- OPTIONAL — run AFTER training-test.sql.
--
-- Inserts module_progress rows marked is_complete = true for
-- every active practice that owns Precise Pico, attributed to
-- their first authorized user. Lets you test the
--   "Complete certification" → /portal/certificates/[deviceId]
-- flow without uploading a video and watching it through.
--
-- Idempotent: safe to re-run. Upserts on
-- (practice_id, practice_user_id, module_id).
--
-- WARNING: this fakes completion data. If a real practice is
-- on the same database (post-launch), running this will pollute
-- their progress records. Pre-launch use only.
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================

do $$
declare
  v_pico_id uuid;
  v_curriculum_id uuid;
  v_practice record;
  v_user_id uuid;
  v_module record;
  v_now timestamptz := now();
  v_count integer := 0;
begin
  select id into v_pico_id
  from public.devices
  where slug = 'precise-pico'
  limit 1;
  if v_pico_id is null then
    raise exception 'Precise Pico device missing.';
  end if;

  select id into v_curriculum_id
  from public.training_curricula
  where device_id = v_pico_id
  limit 1;
  if v_curriculum_id is null then
    raise exception 'Pico curriculum missing. Run training-test.sql first.';
  end if;

  -- Iterate every active practice that owns Pico
  for v_practice in
    select pd.practice_id
    from public.practice_devices pd
    join public.practices p on p.id = pd.practice_id
    where pd.device_id = v_pico_id
      and p.status = 'active'
  loop
    -- Pick the practice's first active authorized user
    select id into v_user_id
    from public.practice_authorized_users
    where practice_id = v_practice.practice_id
      and is_active = true
    order by sort_order asc, created_at asc
    limit 1;

    if v_user_id is null then
      raise notice 'Skipping practice % — no active authorized user', v_practice.practice_id;
      continue;
    end if;

    -- For every module in the Pico curriculum, upsert a complete row
    for v_module in
      select cm.module_id
      from public.curriculum_modules cm
      where cm.curriculum_id = v_curriculum_id
    loop
      insert into public.module_progress (
        practice_id, practice_user_id, module_id,
        watch_percentage, last_position_seconds,
        watch_started_at, watch_completed_at,
        acknowledged, acknowledged_at,
        is_complete, completed_at
      )
      values (
        v_practice.practice_id, v_user_id, v_module.module_id,
        100, 0,
        v_now, v_now,
        true, v_now,
        true, v_now
      )
      on conflict (practice_id, practice_user_id, module_id) do update set
        watch_percentage = 100,
        acknowledged = true,
        acknowledged_at = coalesce(public.module_progress.acknowledged_at, v_now),
        is_complete = true,
        completed_at = coalesce(public.module_progress.completed_at, v_now),
        updated_at = v_now;
      v_count := v_count + 1;
    end loop;

    raise notice 'Pre-completed % modules for practice % (user %)',
      (select count(*) from public.curriculum_modules where curriculum_id = v_curriculum_id),
      v_practice.practice_id,
      v_user_id;
  end loop;

  raise notice 'Total module_progress rows upserted: %', v_count;
end $$;
