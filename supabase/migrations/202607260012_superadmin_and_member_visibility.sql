alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_superadmin = true
  )
$$;

create or replace function public.has_band_role(p_band_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_superadmin()
    or exists (
      select 1
      from public.band_members bm
      where bm.band_id = p_band_id
        and bm.user_id = auth.uid()
        and bm.is_active = true
        and bm.role = any (p_roles)
    )
$$;

create or replace function public.can_view_member_responses(p_band_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.is_superadmin()
    or public.has_band_role(p_band_id, array['planner', 'admin', 'owner'])
    or exists (
      select 1
      from public.bands b
      where b.id = p_band_id
        and b.show_member_responses = true
        and public.is_band_member(p_band_id)
    )
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
using (id = auth.uid() or public.is_superadmin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists bands_select_member on public.bands;
create policy bands_select_member
on public.bands
for select
using (public.is_band_member(id) or public.is_superadmin());

drop policy if exists bands_update_admin_owner on public.bands;
create policy bands_update_admin_owner
on public.bands
for update
using (public.has_band_role(id, array['admin', 'owner']))
with check (public.has_band_role(id, array['admin', 'owner']));

drop policy if exists band_members_select_same_band on public.band_members;
create policy band_members_select_same_band
on public.band_members
for select
using (public.is_band_member(band_id) or public.is_superadmin());

drop policy if exists band_invites_select_admin_owner on public.band_invites;
create policy band_invites_select_admin_owner
on public.band_invites
for select
using (public.has_band_role(band_id, array['admin', 'owner']));

drop policy if exists performances_select_member_or_planner on public.performances;
create policy performances_select_member_or_planner
on public.performances
for select
using (
  (public.is_band_member(band_id) or public.is_superadmin())
  and (
    status <> 'draft'
    or public.has_band_role(band_id, array['planner', 'admin', 'owner'])
  )
);

drop policy if exists performances_insert_planner_plus on public.performances;
create policy performances_insert_planner_plus
on public.performances
for insert
with check (public.has_band_role(band_id, array['planner', 'admin', 'owner']));

drop policy if exists performances_update_planner_plus on public.performances;
create policy performances_update_planner_plus
on public.performances
for update
using (public.has_band_role(band_id, array['planner', 'admin', 'owner']))
with check (public.has_band_role(band_id, array['planner', 'admin', 'owner']));

drop policy if exists performance_responses_select_own_or_planner on public.performance_responses;
create policy performance_responses_select_own_or_planner
on public.performance_responses
for select
using (
  user_id = auth.uid()
  or public.has_band_role(band_id, array['planner', 'admin', 'owner'])
);

drop function if exists public.get_band_members(uuid);

create or replace function public.get_band_members(
  p_band_id uuid
)
returns table (
  membership_id uuid,
  band_id uuid,
  band_name text,
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

  if not public.is_superadmin()
    and not exists (
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
    b.name as band_name,
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
  join public.bands b on b.id = bm.band_id
  where bm.band_id = p_band_id
  order by bm.is_active desc, lower(coalesce(p.display_name, p.email));
end;
$$;

create or replace function public.get_all_members()
returns table (
  membership_id uuid,
  band_id uuid,
  band_name text,
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
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_superadmin() then
    raise exception 'Insufficient permissions';
  end if;

  return query
  select
    bm.id as membership_id,
    bm.band_id,
    b.name as band_name,
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
  join public.bands b on b.id = bm.band_id
  order by lower(b.name), bm.is_active desc, lower(coalesce(p.display_name, p.email));
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
  v_is_superadmin boolean;
begin
  v_actor_id := auth.uid();
  v_is_superadmin := public.is_superadmin();

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

  if not v_is_superadmin and (v_actor_role is null or v_actor_role not in ('admin', 'owner')) then
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

  if not v_is_superadmin and v_actor_role = 'admin' and p_role = 'owner' then
    raise exception 'Admins cannot assign owner role';
  end if;

  if not v_is_superadmin and v_actor_role = 'admin' and v_target.role = 'owner' then
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
  v_is_superadmin boolean;
begin
  v_actor_id := auth.uid();
  v_is_superadmin := public.is_superadmin();

  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select bm.role
    into v_actor_role
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = v_actor_id
    and bm.is_active = true;

  if not v_is_superadmin and (v_actor_role is null or v_actor_role not in ('admin', 'owner')) then
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

  if not v_is_superadmin and v_actor_role = 'admin' and v_target.role = 'owner' then
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
  v_is_superadmin boolean;
begin
  v_actor_id := auth.uid();
  v_is_superadmin := public.is_superadmin();

  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select bm.role
    into v_actor_role
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = v_actor_id
    and bm.is_active = true;

  if not v_is_superadmin and (v_actor_role is null or v_actor_role not in ('admin', 'owner')) then
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

  if not v_is_superadmin and v_actor_role = 'admin' and v_target.role = 'owner' then
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
