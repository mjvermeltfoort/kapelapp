create table public.performance_messages (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references public.performances (id) on delete cascade,
  band_id uuid not null references public.bands (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint performance_messages_body_not_blank check (length(trim(body)) > 0),
  constraint performance_messages_body_length_check check (length(body) <= 1000)
);

create index performance_messages_performance_created_idx
  on public.performance_messages (performance_id, created_at, id);

create or replace function public.populate_performance_message_context()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  select p.band_id
  into new.band_id
  from public.performances p
  where p.id = new.performance_id;

  if new.band_id is null then
    raise exception 'Performance not found';
  end if;

  select coalesce(nullif(trim(p.display_name), ''), p.email)
  into new.author_name
  from public.profiles p
  where p.id = new.user_id;

  if new.author_name is null then
    raise exception 'Author not found';
  end if;

  new.body = trim(new.body);
  return new;
end;
$$;

create trigger performance_messages_populate_context
before insert on public.performance_messages
for each row
execute function public.populate_performance_message_context();

alter table public.performance_messages enable row level security;

create policy performance_messages_select_visible_performance
on public.performance_messages
for select
using (
  exists (
    select 1
    from public.performances p
    where p.id = performance_messages.performance_id
      and p.band_id = performance_messages.band_id
      and (public.is_band_member(p.band_id) or public.is_superadmin())
      and (
        p.status <> 'draft'
        or public.has_band_role(p.band_id, array['planner', 'admin', 'owner'])
      )
  )
);

create policy performance_messages_insert_member
on public.performance_messages
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.performances p
    where p.id = performance_messages.performance_id
      and p.band_id = performance_messages.band_id
      and (public.is_band_member(p.band_id) or public.is_superadmin())
      and (
        p.status <> 'draft'
        or public.has_band_role(p.band_id, array['planner', 'admin', 'owner'])
      )
  )
);

create policy performance_messages_delete_author_or_manager
on public.performance_messages
for delete
using (
  exists (
    select 1
    from public.performances p
    where p.id = performance_messages.performance_id
      and p.band_id = performance_messages.band_id
      and (public.is_band_member(p.band_id) or public.is_superadmin())
      and (
        p.status <> 'draft'
        or public.has_band_role(p.band_id, array['planner', 'admin', 'owner'])
      )
      and (
        performance_messages.user_id = auth.uid()
        or public.has_band_role(p.band_id, array['planner', 'admin', 'owner'])
      )
  )
);
