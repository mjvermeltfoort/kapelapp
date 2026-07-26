create or replace function public.update_my_membership_instrument(
  p_band_id uuid,
  p_instrument text default null
)
returns public.band_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_membership public.band_members;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.band_members
     set instrument = nullif(trim(coalesce(p_instrument, '')), '')
   where band_id = p_band_id
     and user_id = v_user_id
     and is_active = true
  returning * into v_membership;

  if v_membership.id is null then
    raise exception 'Active membership not found';
  end if;

  return v_membership;
end;
$$;

create or replace function public.leave_band(
  p_band_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_role text;
  v_active_owner_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select role
    into v_role
  from public.band_members
  where band_id = p_band_id
    and user_id = v_user_id
    and is_active = true;

  if v_role is null then
    raise exception 'Active membership not found';
  end if;

  if v_role = 'owner' then
    select count(*)::integer
      into v_active_owner_count
    from public.band_members
    where band_id = p_band_id
      and role = 'owner'
      and is_active = true;

    if v_active_owner_count <= 1 then
      raise exception 'Last owner cannot leave band';
    end if;
  end if;

  update public.band_members
     set is_active = false,
         left_at = now()
   where band_id = p_band_id
     and user_id = v_user_id
     and is_active = true;
end;
$$;
