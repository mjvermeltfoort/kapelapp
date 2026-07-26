create or replace function public.auth_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.is_band_member(p_band_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.band_members bm
    where bm.band_id = p_band_id
      and bm.user_id = auth.uid()
      and bm.is_active = true
  )
$$;

create or replace function public.has_band_role(p_band_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
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
    public.has_band_role(p_band_id, array['planner', 'admin', 'owner'])
    or exists (
      select 1
      from public.bands b
      where b.id = p_band_id
        and b.show_member_responses = true
        and public.is_band_member(p_band_id)
    )
$$;

alter table public.profiles enable row level security;
alter table public.bands enable row level security;
alter table public.band_members enable row level security;
alter table public.band_invites enable row level security;
alter table public.performances enable row level security;
alter table public.performance_responses enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
with check (id = auth.uid());

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
using (public.is_band_member(id));

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
using (public.is_band_member(band_id));

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
  public.is_band_member(band_id)
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

drop policy if exists performance_responses_insert_own on public.performance_responses;
create policy performance_responses_insert_own
on public.performance_responses
for insert
with check (
  user_id = auth.uid()
  and public.is_band_member(band_id)
);

drop policy if exists performance_responses_update_own on public.performance_responses;
create policy performance_responses_update_own
on public.performance_responses
for update
using (user_id = auth.uid() and public.is_band_member(band_id))
with check (user_id = auth.uid() and public.is_band_member(band_id));
