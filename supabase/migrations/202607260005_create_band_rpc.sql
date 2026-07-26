create or replace function public.create_band(
  p_name text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_band_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Band name is required';
  end if;

  insert into public.bands (
    name,
    description,
    created_by
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_description, '')), ''),
    v_user_id
  )
  returning id into v_band_id;

  insert into public.band_members (
    band_id,
    user_id,
    role,
    instrument,
    is_active,
    joined_at,
    left_at
  )
  values (
    v_band_id,
    v_user_id,
    'owner',
    null,
    true,
    now(),
    null
  );

  return v_band_id;
end;
$$;
