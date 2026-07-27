alter table public.band_invites
  add column if not exists token text;

create or replace function public.create_band_invite(
  p_band_id uuid,
  p_expires_at timestamptz default null,
  p_max_uses integer default null,
  p_role text default 'member'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid;
  v_token text;
  v_token_hash text;
  v_invite_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_role <> 'member' then
    raise exception 'Only member invites are supported';
  end if;

  if p_max_uses is not null and p_max_uses <= 0 then
    raise exception 'max_uses must be greater than zero';
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

  perform 1
  from public.bands
  where id = p_band_id
  for update;

  update public.band_invites
     set is_active = false,
         revoked_at = now(),
         updated_at = now()
   where band_id = p_band_id
     and is_active = true;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  insert into public.band_invites (
    band_id,
    created_by,
    role,
    token,
    token_hash,
    is_active,
    expires_at,
    max_uses,
    use_count,
    revoked_at
  )
  values (
    p_band_id,
    v_user_id,
    p_role,
    v_token,
    v_token_hash,
    true,
    p_expires_at,
    p_max_uses,
    0,
    null
  )
  returning id into v_invite_id;

  return jsonb_build_object(
    'id', v_invite_id,
    'token', v_token,
    'role', p_role,
    'expires_at', p_expires_at,
    'max_uses', p_max_uses,
    'use_count', 0,
    'created_at', now()
  );
end;
$$;

create or replace function public.get_current_band_invite(
  p_band_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid;
  v_invite record;
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

  perform 1
  from public.bands
  where id = p_band_id
  for update;

  select
    i.id,
    i.token,
    i.role,
    i.expires_at,
    i.max_uses,
    i.use_count,
    i.created_at
  into v_invite
  from public.band_invites i
  where i.band_id = p_band_id
    and i.is_active = true
    and i.revoked_at is null
    and i.token is not null
    and (i.expires_at is null or i.expires_at > now())
    and (i.max_uses is null or i.use_count < i.max_uses)
  order by i.created_at desc
  limit 1;

  if v_invite.id is null then
    return public.create_band_invite(p_band_id);
  end if;

  return jsonb_build_object(
    'id', v_invite.id,
    'token', v_invite.token,
    'role', v_invite.role,
    'expires_at', v_invite.expires_at,
    'max_uses', v_invite.max_uses,
    'use_count', v_invite.use_count,
    'created_at', v_invite.created_at
  );
end;
$$;

create or replace function public.regenerate_band_invite(
  p_band_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  return public.create_band_invite(p_band_id);
end;
$$;
