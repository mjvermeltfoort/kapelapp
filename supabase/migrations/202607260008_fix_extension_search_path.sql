create or replace function public.create_band(
  p_name text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
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

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  insert into public.band_invites (
    band_id,
    created_by,
    role,
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
    'max_uses', p_max_uses
  );
end;
$$;

create or replace function public.get_join_invite_preview(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_token_hash text;
  v_invite record;
  v_status text;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return jsonb_build_object('status', 'invalid');
  end if;

  v_token_hash := encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  select
    i.id,
    i.is_active,
    i.expires_at,
    i.max_uses,
    i.use_count,
    i.revoked_at,
    b.id as band_id,
    b.name as band_name
  into v_invite
  from public.band_invites i
  join public.bands b on b.id = i.band_id
  where i.token_hash = v_token_hash;

  if v_invite.id is null then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_invite.revoked_at is not null or not v_invite.is_active then
    v_status := 'revoked';
  elsif v_invite.expires_at is not null and v_invite.expires_at <= now() then
    v_status := 'expired';
  elsif v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    v_status := 'exhausted';
  else
    v_status := 'valid';
  end if;

  return jsonb_build_object(
    'status', v_status,
    'band_id', v_invite.band_id,
    'band_name', v_invite.band_name
  );
end;
$$;

create or replace function public.accept_band_invite(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid;
  v_token_hash text;
  v_invite record;
  v_membership record;
  v_membership_status text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'Invalid invite token';
  end if;

  v_token_hash := encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  select
    i.id,
    i.band_id,
    i.role,
    i.is_active,
    i.expires_at,
    i.max_uses,
    i.use_count,
    i.revoked_at,
    b.name as band_name
  into v_invite
  from public.band_invites i
  join public.bands b on b.id = i.band_id
  where i.token_hash = v_token_hash
  for update of i;

  if v_invite.id is null then
    raise exception 'Invalid invite token';
  end if;

  if v_invite.revoked_at is not null or not v_invite.is_active then
    raise exception 'Invite is no longer active';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'Invite has expired';
  end if;

  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    raise exception 'Invite usage limit reached';
  end if;

  select *
    into v_membership
  from public.band_members
  where band_id = v_invite.band_id
    and user_id = v_user_id
  for update;

  if v_membership.id is not null and v_membership.is_active = true then
    return jsonb_build_object(
      'band_id', v_invite.band_id,
      'band_name', v_invite.band_name,
      'membership_status', 'already_active'
    );
  end if;

  if v_membership.id is not null then
    update public.band_members
       set is_active = true,
           left_at = null,
           role = 'member'
     where id = v_membership.id;

    v_membership_status := 'reactivated';
  else
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
      v_invite.band_id,
      v_user_id,
      'member',
      null,
      true,
      now(),
      null
    );

    v_membership_status := 'created';
  end if;

  update public.band_invites
     set use_count = use_count + 1,
         last_used_at = now()
   where id = v_invite.id;

  return jsonb_build_object(
    'band_id', v_invite.band_id,
    'band_name', v_invite.band_name,
    'membership_status', v_membership_status
  );
end;
$$;
