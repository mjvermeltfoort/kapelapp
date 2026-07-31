create or replace function public.get_performance_response_overview(
  p_performance_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_band_id uuid;
  v_result jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select band_id
    into v_band_id
  from public.performances
  where id = p_performance_id;

  if v_band_id is null then
    raise exception 'Performance not found';
  end if;

  if not public.is_band_member(v_band_id) then
    raise exception 'Insufficient permissions';
  end if;

  with active_members as (
    select
      bm.user_id,
      bm.instrument,
      coalesce(nullif(trim(p.display_name), ''), p.email) as display_name
    from public.band_members bm
    join public.profiles p on p.id = bm.user_id
    where bm.band_id = v_band_id
      and bm.is_active = true
  ),
  responses as (
    select
      pr.user_id,
      pr.response,
      pr.reason,
      pr.responded_at,
      am.display_name,
      am.instrument
    from public.performance_responses pr
    join active_members am on am.user_id = pr.user_id
    where pr.performance_id = p_performance_id
  ),
  non_responders as (
    select
      am.user_id,
      am.display_name,
      am.instrument
    from active_members am
    left join responses r on r.user_id = am.user_id
    where r.user_id is null
  ),
  instrument_counts as (
    select
      coalesce(nullif(trim(am.instrument), ''), 'Onbekend') as instrument,
      count(*) filter (where r.response = 'yes') as yes_count,
      count(*) filter (where r.response = 'maybe') as maybe_count,
      count(*) filter (where r.response = 'no') as no_count,
      count(*) filter (where r.user_id is null) as no_response_count,
      count(*) as total_count
    from active_members am
    left join responses r on r.user_id = am.user_id
    group by coalesce(nullif(trim(am.instrument), ''), 'Onbekend')
    order by instrument
  )
  select jsonb_build_object(
    'performance', (
      select jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'performance_date', p.performance_date,
        'start_time', p.start_time,
        'location', p.location,
        'status', p.status,
        'response_deadline', p.response_deadline
      )
      from public.performances p
      where p.id = p_performance_id
    ),
    'counts', jsonb_build_object(
      'yes', (select count(*) from responses where response = 'yes'),
      'maybe', (select count(*) from responses where response = 'maybe'),
      'no', (select count(*) from responses where response = 'no'),
      'no_response', (select count(*) from non_responders),
      'total_members', (select count(*) from active_members)
    ),
    'yes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', user_id,
        'display_name', display_name,
        'instrument', instrument,
        'responded_at', responded_at
      ) order by display_name)
      from responses
      where response = 'yes'
    ), '[]'::jsonb),
    'maybe', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', user_id,
        'display_name', display_name,
        'instrument', instrument,
        'reason', reason,
        'responded_at', responded_at
      ) order by display_name)
      from responses
      where response = 'maybe'
    ), '[]'::jsonb),
    'no', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', user_id,
        'display_name', display_name,
        'instrument', instrument,
        'reason', reason,
        'responded_at', responded_at
      ) order by display_name)
      from responses
      where response = 'no'
    ), '[]'::jsonb),
    'no_response', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', user_id,
        'display_name', display_name,
        'instrument', instrument
      ) order by display_name)
      from non_responders
    ), '[]'::jsonb),
    'instrument_counts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'instrument', instrument,
        'yes', yes_count,
        'maybe', maybe_count,
        'no', no_count,
        'no_response', no_response_count,
        'total', total_count
      ) order by instrument)
      from instrument_counts
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;
