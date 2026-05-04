-- ============================================================
-- Precise Aesthetics — Admin Dashboard RPCs (Session P7)
-- ============================================================
-- Seven SECURITY DEFINER functions that aggregate treatment data
-- across all practices for the admin dashboard. Each gates on
-- public.is_admin() at the top — non-admin callers raise an
-- exception. RLS would block these reads if called via session
-- client; SECURITY DEFINER bypasses RLS but the auth gate keeps
-- the surface admin-only.
--
-- All return jsonb so the application layer can consume them
-- without per-function type plumbing. Performance-tested up to
-- ~10k treatments; bundle into a single RPC if launch traffic
-- demands it (deferred to P11/P12 polish per spec callout 6).
-- ============================================================
-- HOLD: review before applying to production Supabase. Per
-- CLAUDE.md database safety rules — never run automatically.
-- ============================================================

-- ------------------------------------------------------------
-- 1. dashboard_top_line — KPI row counts + comparison period
-- ------------------------------------------------------------
create or replace function public.dashboard_top_line(
  range_start timestamptz,
  range_end timestamptz,
  comparison_start timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  select jsonb_build_object(
    'total_treatments', (
      select count(*) from public.treatments
      where treatment_date >= range_start::date
        and treatment_date <= range_end::date
    ),
    'total_treatments_prior', (
      select count(*) from public.treatments
      where treatment_date >= comparison_start::date
        and treatment_date < range_start::date
    ),
    'active_practices', (
      select count(distinct practice_id) from public.treatments
      where treatment_date >= range_start::date
        and treatment_date <= range_end::date
    ),
    'total_practices', (
      select count(*) from public.practices
      where status = 'active'
    ),
    'adverse_events', (
      select count(*) from public.treatment_adverse_events
      where created_at >= range_start
        and created_at <= range_end
    ),
    'adverse_events_prior', (
      select count(*) from public.treatment_adverse_events
      where created_at >= comparison_start
        and created_at < range_start
    ),
    'photos_uploaded', (
      select count(*) from public.treatment_photos
      where created_at >= range_start
        and created_at <= range_end
    ),
    'photos_uploaded_prior', (
      select count(*) from public.treatment_photos
      where created_at >= comparison_start
        and created_at < range_start
    )
  ) into result;

  return result;
end;
$$;

-- ------------------------------------------------------------
-- 2. dashboard_volume_timeseries — bucketed treatment counts
-- bucket: 'day' | 'week' | 'month' (per spec callout 3)
-- ------------------------------------------------------------
create or replace function public.dashboard_volume_timeseries(
  range_start timestamptz,
  range_end timestamptz,
  bucket text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  trunc_unit text;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  if bucket not in ('day', 'week', 'month') then
    raise exception 'bucket must be day, week, or month';
  end if;
  trunc_unit := bucket;

  select jsonb_agg(jsonb_build_object('bucket', bucket_start, 'count', n) order by bucket_start)
  into result
  from (
    select date_trunc(trunc_unit, treatment_date::timestamptz) as bucket_start, count(*)::int as n
    from public.treatments
    where treatment_date >= range_start::date
      and treatment_date <= range_end::date
    group by 1
  ) s;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ------------------------------------------------------------
-- 3. dashboard_protocol_stats — most-used protocols + AE rate
-- Returns top 10 by treatment_count for the table widget.
-- Coverage matrix (per-protocol-per-fitz) lives in a separate RPC
-- so each function does one thing well.
-- ------------------------------------------------------------
create or replace function public.dashboard_protocol_stats(
  range_start timestamptz,
  range_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  with t_in_range as (
    select id, protocol_id, treatment_date, patient_fitzpatrick
    from public.treatments
    where treatment_date >= range_start::date
      and treatment_date <= range_end::date
  ),
  ae_in_range as (
    select treatment_id
    from public.treatment_adverse_events
    where created_at >= range_start and created_at <= range_end
  )
  select jsonb_agg(row_to_json(s) order by s.treatment_count desc)
  into result
  from (
    select
      p.id as protocol_id,
      p.title,
      p.slug,
      coalesce(p.current_version, '—') as current_version,
      count(distinct t.id)::int as treatment_count,
      count(distinct ae.treatment_id)::int as adverse_event_count,
      max(t.treatment_date) as last_used_date,
      mode() within group (order by t.patient_fitzpatrick) as common_fitzpatrick
    from public.protocols p
    join t_in_range t on t.protocol_id = p.id
    left join ae_in_range ae on ae.treatment_id = t.id
    group by p.id, p.title, p.slug, p.current_version
    order by treatment_count desc
    limit 10
  ) s;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ------------------------------------------------------------
-- 3b. dashboard_protocol_coverage — per-protocol-per-fitz counts
-- Powers the stacked bar chart. Returns top-10 protocols (by total
-- treatment count) with their Fitzpatrick breakdown, so the chart's
-- ordering matches the protocol_stats table.
-- ------------------------------------------------------------
create or replace function public.dashboard_protocol_coverage(
  range_start timestamptz,
  range_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  with t_in_range as (
    select id, protocol_id, patient_fitzpatrick
    from public.treatments
    where treatment_date >= range_start::date
      and treatment_date <= range_end::date
  ),
  protocol_totals as (
    select t.protocol_id, count(*)::int as total
    from t_in_range t
    group by t.protocol_id
    order by total desc
    limit 10
  ),
  protocol_breakdown as (
    select
      t.protocol_id,
      coalesce(t.patient_fitzpatrick, 'unknown') as fitz,
      count(*)::int as n
    from t_in_range t
    where t.protocol_id in (select protocol_id from protocol_totals)
    group by t.protocol_id, coalesce(t.patient_fitzpatrick, 'unknown')
  )
  select jsonb_agg(row_to_json(s))
  into result
  from (
    select
      p.id as protocol_id,
      p.title,
      pt.total as treatment_count,
      jsonb_object_agg(pb.fitz, pb.n) as by_fitzpatrick
    from protocol_totals pt
    join public.protocols p on p.id = pt.protocol_id
    left join protocol_breakdown pb on pb.protocol_id = pt.protocol_id
    group by p.id, p.title, pt.total
    order by pt.total desc
  ) s;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ------------------------------------------------------------
-- 4. dashboard_indication_distribution — top 8 + "other"
-- ------------------------------------------------------------
create or replace function public.dashboard_indication_distribution(
  range_start timestamptz,
  range_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  with counted as (
    select indication, count(*)::int as n
    from public.treatments
    where treatment_date >= range_start::date
      and treatment_date <= range_end::date
    group by indication
    order by n desc
  ),
  top_n as (
    select indication, n from counted limit 8
  ),
  other_sum as (
    select 'Other' as indication, coalesce(sum(n), 0)::int as n
    from counted
    where indication not in (select indication from top_n)
  )
  select jsonb_agg(row_to_json(merged))
  into result
  from (
    select * from top_n
    union all
    select * from other_sum where n > 0
  ) merged;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ------------------------------------------------------------
-- 5. dashboard_fitzpatrick_distribution — six bars (I..VI)
-- ------------------------------------------------------------
create or replace function public.dashboard_fitzpatrick_distribution(
  range_start timestamptz,
  range_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  -- Always return all six entries even when count is 0; chart needs
  -- the consistent x-axis even at empty state.
  select jsonb_agg(jsonb_build_object('fitzpatrick', f, 'count', coalesce(c.n, 0)))
  into result
  from (values ('I'), ('II'), ('III'), ('IV'), ('V'), ('VI')) as types(f)
  left join (
    select patient_fitzpatrick, count(*)::int as n
    from public.treatments
    where treatment_date >= range_start::date
      and treatment_date <= range_end::date
    group by patient_fitzpatrick
  ) c on c.patient_fitzpatrick = types.f;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ------------------------------------------------------------
-- 6. dashboard_adverse_events_summary — counts + 5 most-recent
-- ------------------------------------------------------------
create or replace function public.dashboard_adverse_events_summary(
  range_start timestamptz,
  range_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  status_counts jsonb;
  recent jsonb;
  total_count int;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  select count(*)::int into total_count
  from public.treatment_adverse_events
  where created_at >= range_start and created_at <= range_end;

  select jsonb_object_agg(status, n) into status_counts
  from (
    select status, count(*)::int as n
    from public.treatment_adverse_events
    where created_at >= range_start and created_at <= range_end
    group by status
  ) s;

  select jsonb_agg(row_to_json(r))
  into recent
  from (
    select
      ae.id,
      ae.created_at,
      ae.status,
      ae.practice_id,
      t.indication,
      t.patient_fitzpatrick,
      t.treatment_date
    from public.treatment_adverse_events ae
    join public.treatments t on t.id = ae.treatment_id
    where ae.created_at >= range_start and ae.created_at <= range_end
    order by ae.created_at desc
    limit 5
  ) r;

  return jsonb_build_object(
    'total', total_count,
    'by_status', coalesce(status_counts, '{}'::jsonb),
    'recent', coalesce(recent, '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------------
-- 7. dashboard_recent_treatments — 20 most-recent across all
-- practices, anonymized (no practice name; client does the
-- 4-char hash from practice_id).
-- ------------------------------------------------------------
create or replace function public.dashboard_recent_treatments(
  limit_count int default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  select jsonb_agg(row_to_json(r) order by r.created_at desc)
  into result
  from (
    select
      t.id,
      t.created_at,
      t.treatment_date,
      t.indication,
      t.patient_fitzpatrick,
      t.protocol_version_label,
      t.practice_id,
      p.title as protocol_title,
      p.slug as protocol_slug,
      (select count(*)::int from public.treatment_photos where treatment_id = t.id) as photo_count,
      exists (select 1 from public.treatment_adverse_events where treatment_id = t.id) as has_adverse_event
    from public.treatments t
    left join public.protocols p on p.id = t.protocol_id
    order by t.created_at desc
    limit limit_count
  ) r;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ------------------------------------------------------------
-- Grants — RPCs callable by authenticated role; admin gate
-- enforced inside each function.
-- ------------------------------------------------------------
grant execute on function public.dashboard_top_line(timestamptz, timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_volume_timeseries(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.dashboard_protocol_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_protocol_coverage(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_indication_distribution(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_fitzpatrick_distribution(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_adverse_events_summary(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_recent_treatments(int) to authenticated;
