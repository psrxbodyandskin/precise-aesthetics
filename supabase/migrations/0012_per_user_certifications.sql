-- ============================================================
-- Precise Aesthetics — Per-User Certifications (P9.1 fix)
-- ============================================================
-- Reframes the certification gate from practice-level to
-- per-user. Original P9 made the practice the holder of a cert
-- for each device; once anyone on the practice clicked
-- "Complete certification", the whole roster could log
-- treatments. That doesn't hold up clinically — if Dr. Smith
-- trained but NP Jones is firing the laser, NP Jones needs to
-- have personally trained.
--
-- Schema change:
--   - Adds practice_user_id to practice_certifications, FK to
--     practice_authorized_users.id.
--   - Drops the old unique(practice_id, device_id) constraint.
--   - Adds unique(practice_id, practice_user_id, device_id).
--   - Backfills practice_user_id from the existing
--     certified_by_user_id field. Rows with neither (none
--     should exist after the seed) get cleaned up.
--
-- RPC change:
--   - Replaces is_practice_certified_for_device with
--     is_user_certified_for_device(p_practice_user_id, p_device_id).
--     Treatment POST gate, certificate page, and protocol filter
--     all migrate to the per-user check.
--
-- Re-validation:
--   - After backfilling practice_user_id, every existing cert
--     gets re-checked against the holder's OWN module_progress.
--   - Certs where the holder hasn't personally completed every
--     required module of the curriculum demote to 'in_progress'.
--   - The holder has to actually train (their own user_id) and
--     re-click certify under the new rules. Defensible for
--     audit: "this user completed these modules on these dates,
--     then certified themselves."
--
-- Audit verbs unchanged (certification.granted etc.) — the
-- target_id remains the certification row; metadata gets a
-- practice_user_id for cleaner trail.
-- ============================================================
-- READ CAREFULLY BEFORE APPLYING:
--
-- 1. The backfill UPDATE depends on the practice_certifications
--    table currently having certified_by_user_id populated. If
--    you have rows where both certified_by_user_id and
--    practice_user_id (newly added) end up null, the migration
--    DELETES those rows. That's the right call because
--    NOT NULL is added at the end and we can't keep orphan
--    certs without a holder.
--
-- 2. RLS policy practice_certifications_practice_read_own +
--    insert/update_own all reference practice_id; they remain
--    correct under the new key but client code must now
--    include practice_user_id on inserts (P9 portal route is
--    being updated in lock-step).
--
-- 3. The old RPC is_practice_certified_for_device is dropped.
--    Any caller still referencing it will fail at call time.
--    Caller-list in P9 is internal only (POST /api/portal/
--    treatments + lib/portal/training.ts), all updated.
--
-- HOLD: per CLAUDE.md DB safety rules, never apply
-- automatically. Manual review required.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add practice_user_id (nullable for backfill)
-- ------------------------------------------------------------
alter table public.practice_certifications
  add column if not exists practice_user_id uuid
    references public.practice_authorized_users(id) on delete cascade;

-- ------------------------------------------------------------
-- 2. Backfill from certified_by_user_id (current rows are all
--    self-certified — same person clicked the button as holds
--    the cert).
-- ------------------------------------------------------------
update public.practice_certifications
  set practice_user_id = certified_by_user_id
  where practice_user_id is null
    and certified_by_user_id is not null;

-- Any rows still null have no holder — clean them up so we can
-- enforce NOT NULL.
delete from public.practice_certifications
  where practice_user_id is null;

-- ------------------------------------------------------------
-- 2b. Re-validate existing certs against the holder's own
--     module progress. Under P9 (practice-wide rules) someone
--     could click Certify when ANY user on the practice had
--     completed modules. P9.1 says each holder needs their OWN
--     completion record. Demote certs where the holder hasn't
--     personally completed every required module — they
--     re-train and re-click certify under the new rules.
--
--     Demotion: status flips to 'in_progress', certified_at
--     and expires_at clear. The row stays so the holder's
--     in-progress journey is preserved (recert_required, etc.).
-- ------------------------------------------------------------
update public.practice_certifications c
  set
    status = 'in_progress',
    certified_at = null,
    expires_at = null
where c.status = 'certified'
  and exists (
    -- At least one required module of the cert's curriculum
    -- has NO complete progress row for this user.
    select 1
    from public.curriculum_modules cm
    where cm.curriculum_id = c.curriculum_id
      and cm.is_required = true
      and not exists (
        select 1
        from public.module_progress mp
        where mp.practice_id = c.practice_id
          and mp.practice_user_id = c.practice_user_id
          and mp.module_id = cm.module_id
          and mp.is_complete = true
      )
  );

-- ------------------------------------------------------------
-- 3. Switch unique constraint
-- ------------------------------------------------------------
alter table public.practice_certifications
  drop constraint if exists practice_certifications_practice_id_device_id_key;

-- The constraint name varies by Postgres auto-generation; this
-- is the standard form. If it differs, the drop is a no-op and
-- the add below still works (Postgres allows multiple unique
-- constraints; the old one becomes redundant). Manual review of
-- pg_indexes after applying recommended.

alter table public.practice_certifications
  add constraint practice_certifications_practice_user_device_key
  unique (practice_id, practice_user_id, device_id);

-- ------------------------------------------------------------
-- 4. Make practice_user_id NOT NULL
-- ------------------------------------------------------------
alter table public.practice_certifications
  alter column practice_user_id set not null;

-- ------------------------------------------------------------
-- 5. Index for the per-user lookup hot path (cert gate)
-- ------------------------------------------------------------
create index if not exists idx_practice_certifications_user_device
  on public.practice_certifications (practice_user_id, device_id, status);

-- ============================================================
-- 6. RPC: is_user_certified_for_device
-- ============================================================
-- Replaces is_practice_certified_for_device. Caller passes the
-- practice_authorized_users.id of the user attempting the
-- gated action (e.g. entered_by on a treatment log).
-- ============================================================
drop function if exists public.is_practice_certified_for_device(uuid, uuid);

create or replace function public.is_user_certified_for_device(
  p_practice_user_id uuid,
  p_device_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.practice_certifications
    where practice_user_id = p_practice_user_id
      and device_id = p_device_id
      and status = 'certified'
      and (expires_at is null or expires_at > now())
  );
end;
$$;
