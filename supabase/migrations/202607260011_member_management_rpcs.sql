create or replace function public.get_band_members(
  p_band_id uuid
)
returns table (
  membership_id uuid,
  band_id uuid,
  user_id uuid,
  email text,
  display_name text,
  role text,
  instrument text,
  is_active boolean,
  joined_at timestamptz,
  left_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.band_members
    where band_id = p_band_id
      and user_id = v_user_id
      and is_active = true
      and role in ('admin', 'owner')
  ) then
    raise exception 'Insufficient permissions';
  end if;

  return query
  select
    bm.id as membership_id,
    bm.band_id,
    bm.user_id,
    p.email,
    p.display_name,
    bm.role,
    bm.instrument,
    bm.is_active,
    bm.joined_at,
    bm.left_at
  from public.band_members bm
  join public.profiles p on p.id = bm.user_id
  where bm.band_id = p_band_id
  order by bm.is_active desc, lower(coalesce(p.display_name, p.email));
end;
$$;

create or replace function public.set_band_member_role(
  p_band_id uuid,
  p_user_id uuid,
  p_role text
)
returns public.band_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_target public.band_members;
  v_owner_count integer;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_role not in ('member', 'planner', 'admin', 'owner') then
    raise exception 'Invalid role';
  end if;

  select bm.role
    into v_actor_role
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = v_actor_id
    and bm.is_active = true;

  if v_actor_role is null or v_actor_role not in ('admin', 'owner') then
    raise exception 'Insufficient permissions';
  end if;

  select *
    into v_target
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = p_user_id;

  if v_target.id is null then
    raise exception 'Membership not found';
  end if;

  if v_actor_role = 'admin' and p_role = 'owner' then
    raise exception 'Admins cannot assign owner role';
  end if;

  if v_actor_role = 'admin' and v_target.role = 'owner' then
    raise exception 'Admins cannot change owner memberships';
  end if;

  if v_target.role = 'owner' and p_role <> 'owner' then
    select count(*)::integer
      into v_owner_count
    from public.band_members
    where band_id = p_band_id
      and role = 'owner'
      and is_active = true;

    if v_owner_count <= 1 then
      raise exception 'Last owner cannot lose owner role';
    end if;
  end if;

  update public.band_members
     set role = p_role
   where id = v_target.id
  returning * into v_target;

  return v_target;
end;
$$;

create or replace function public.deactivate_band_member(
  p_band_id uuid,
  p_user_id uuid
)
returns public.band_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_target public.band_members;
  v_owner_count integer;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select bm.role
    into v_actor_role
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = v_actor_id
    and bm.is_active = true;

  if v_actor_role is null or v_actor_role not in ('admin', 'owner') then
    raise exception 'Insufficient permissions';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'Use leave_band for your own membership';
  end if;

  select *
    into v_target
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = p_user_id
    and bm.is_active = true;

  if v_target.id is null then
    raise exception 'Active membership not found';
  end if;

  if v_actor_role = 'admin' and v_target.role = 'owner' then
    raise exception 'Admins cannot deactivate owners';
  end if;

  if v_target.role = 'owner' then
    select count(*)::integer
      into v_owner_count
    from public.band_members
    where band_id = p_band_id
      and role = 'owner'
      and is_active = true;

    if v_owner_count <= 1 then
      raise exception 'Last owner cannot be deactivated';
    end if;
  end if;

  update public.band_members
     set is_active = false,
         left_at = now()
   where id = v_target.id
  returning * into v_target;

  return v_target;
end;
$$;

create or replace function public.reactivate_band_member(
  p_band_id uuid,
  p_user_id uuid
)
returns public.band_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_target public.band_members;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select bm.role
    into v_actor_role
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = v_actor_id
    and bm.is_active = true;

  if v_actor_role is null or v_actor_role not in ('admin', 'owner') then
    raise exception 'Insufficient permissions';
  end if;

  select *
    into v_target
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = p_user_id;

  if v_target.id is null then
    raise exception 'Membership not found';
  end if;

  if v_target.is_active = true then
    return v_target;
  end if;

  if v_actor_role = 'admin' and v_target.role = 'owner' then
    raise exception 'Admins cannot reactivate owners';
  end if;

  update public.band_members
     set is_active = true,
         left_at = null
   where id = v_target.id
  returning * into v_target;

  return v_target;
end;
$$;
