create table if not exists public.band_instruments (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  name text not null,
  normalized_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint band_instruments_name_not_blank check (length(trim(name)) > 0),
  constraint band_instruments_normalized_name_not_blank check (length(trim(normalized_name)) > 0),
  constraint band_instruments_band_normalized_name_unique unique (band_id, normalized_name)
);

create index if not exists band_instruments_band_active_sort_idx
  on public.band_instruments (band_id, is_active, sort_order, name);

create or replace function public.normalize_instrument_name(p_name text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(p_name, ''))), '\s+', ' ', 'g')
$$;

create or replace function public.normalize_band_instrument_fields()
returns trigger
language plpgsql
as $$
begin
  new.name := trim(new.name);
  new.normalized_name := public.normalize_instrument_name(new.name);
  return new;
end;
$$;

alter table public.band_instruments enable row level security;

create trigger band_instruments_set_updated_at
before update on public.band_instruments
for each row
execute function public.set_updated_at();

create trigger band_instruments_normalize_fields
before insert or update on public.band_instruments
for each row
execute function public.normalize_band_instrument_fields();

drop policy if exists band_instruments_select_member on public.band_instruments;
create policy band_instruments_select_member
on public.band_instruments
for select
using (public.is_band_member(band_id) and is_active = true);

drop policy if exists band_instruments_manage_admin_owner on public.band_instruments;
create policy band_instruments_manage_admin_owner
on public.band_instruments
for all
using (public.has_band_role(band_id, array['admin', 'owner']))
with check (public.has_band_role(band_id, array['admin', 'owner']));

create or replace function public.get_band_instruments(
  p_band_id uuid,
  p_include_inactive boolean default false
)
returns table (
  id uuid,
  band_id uuid,
  name text,
  normalized_name text,
  sort_order integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    bi.id,
    bi.band_id,
    bi.name,
    bi.normalized_name,
    bi.sort_order,
    bi.is_active,
    bi.created_at,
    bi.updated_at
  from public.band_instruments bi
  where bi.band_id = p_band_id
    and (p_include_inactive or bi.is_active = true)
    and (
      public.is_band_member(p_band_id)
      or public.has_band_role(p_band_id, array['admin', 'owner'])
    )
  order by bi.sort_order asc, bi.name asc
$$;

create or replace function public.create_band_instrument(
  p_band_id uuid,
  p_name text
)
returns public.band_instruments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
  v_sort_order integer;
  v_result public.band_instruments;
begin
  v_name := trim(coalesce(p_name, ''));

  if v_name = '' then
    raise exception 'Instrument name is required';
  end if;

  if not public.has_band_role(p_band_id, array['admin', 'owner']) then
    raise exception 'Insufficient permissions';
  end if;

  select coalesce(max(bi.sort_order), -1) + 1
    into v_sort_order
  from public.band_instruments bi
  where bi.band_id = p_band_id;

  insert into public.band_instruments (
    band_id,
    name,
    normalized_name,
    sort_order,
    is_active
  )
  values (
    p_band_id,
    v_name,
    public.normalize_instrument_name(v_name),
    v_sort_order,
    true
  )
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.update_band_instrument(
  p_instrument_id uuid,
  p_name text
)
returns public.band_instruments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
  v_result public.band_instruments;
begin
  v_name := trim(coalesce(p_name, ''));

  if v_name = '' then
    raise exception 'Instrument name is required';
  end if;

  if not exists (
    select 1
    from public.band_instruments bi
    where bi.id = p_instrument_id
      and public.has_band_role(bi.band_id, array['admin', 'owner'])
  ) then
    raise exception 'Insufficient permissions';
  end if;

  update public.band_instruments bi
     set name = v_name,
         normalized_name = public.normalize_instrument_name(v_name)
   where bi.id = p_instrument_id
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.deactivate_band_instrument(
  p_instrument_id uuid
)
returns public.band_instruments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result public.band_instruments;
begin
  if not exists (
    select 1
    from public.band_instruments bi
    where bi.id = p_instrument_id
      and public.has_band_role(bi.band_id, array['admin', 'owner'])
  ) then
    raise exception 'Insufficient permissions';
  end if;

  update public.band_instruments bi
     set is_active = false
   where bi.id = p_instrument_id
  returning * into v_result;

  return v_result;
end;
$$;
