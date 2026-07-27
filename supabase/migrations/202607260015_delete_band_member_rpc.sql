create or replace function public.delete_band_member(
  p_band_id uuid,
  p_user_id uuid
)
returns void
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

  select bm.*
    into v_target
  from public.band_members bm
  where bm.band_id = p_band_id
    and bm.user_id = p_user_id;

  if v_target.id is null then
    raise exception 'Membership not found';
  end if;

  if not v_is_superadmin and v_actor_role = 'admin' and v_target.role = 'owner' then
    raise exception 'Admins cannot delete owner memberships';
  end if;

  if v_target.role = 'owner' and v_target.is_active then
    select count(*)::integer
      into v_owner_count
    from public.band_members bm
    where bm.band_id = p_band_id
      and bm.role = 'owner'
      and bm.is_active = true;

    if v_owner_count <= 1 then
      raise exception 'Last owner cannot be deleted';
    end if;
  end if;

  delete from public.band_members bm
  where bm.id = v_target.id;
end;
$$;
