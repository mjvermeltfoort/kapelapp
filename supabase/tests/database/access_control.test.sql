begin;

create extension if not exists pgtap with schema extensions;

select plan(34);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-000000000001', 'owner@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'admin@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'planner@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', 'member@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000005', 'outsider@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000006', 'super@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000007', 'member2@example.com', 'authenticated', 'authenticated');

insert into public.profiles (id, email, display_name, is_superadmin) values
  ('00000000-0000-0000-0000-000000000001', 'owner@example.com', 'Owner', false),
  ('00000000-0000-0000-0000-000000000002', 'admin@example.com', 'Admin', false),
  ('00000000-0000-0000-0000-000000000003', 'planner@example.com', 'Planner', false),
  ('00000000-0000-0000-0000-000000000004', 'member@example.com', 'Member', false),
  ('00000000-0000-0000-0000-000000000005', 'outsider@example.com', 'Outsider', false),
  ('00000000-0000-0000-0000-000000000006', 'super@example.com', 'Super', true),
  ('00000000-0000-0000-0000-000000000007', 'member2@example.com', 'Member Two', false);

insert into public.bands (id, name, created_by) values
  ('b0000000-0000-0000-0000-000000000001', 'Testkapel', '00000000-0000-0000-0000-000000000001');

insert into public.band_members (band_id, user_id, role) values
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'admin'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'planner'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'member'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'member');

insert into public.performances (id, band_id, title, performance_date, start_time, location, status, created_by, updated_by) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Published', current_date + 7, '20:00', 'Zaal',
   'published', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Draft', current_date + 14, '20:00', 'Zaal',
   'draft', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003');

insert into public.performance_responses (performance_id, band_id, user_id, response) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'yes');

-- Profiles

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}', true);

select throws_ok(
  $$ update public.profiles set is_superadmin = true where id = auth.uid() $$,
  '42501', null,
  'member cannot make themselves superadmin'
);
select lives_ok(
  $$ update public.profiles set display_name = 'Lid' where id = auth.uid() $$,
  'member can update own display name'
);
select is(
  (select count(*)::int from public.profiles),
  1,
  'member only sees own profile'
);

-- Member

select is(
  (select array_agg(title order by title) from public.performances),
  array['Published'],
  'member sees published performances only'
);
select throws_ok(
  $$ insert into public.performances (band_id, title, performance_date, start_time, location, created_by, updated_by)
     values ('b0000000-0000-0000-0000-000000000001', 'Nope', current_date, '20:00', 'X', auth.uid(), auth.uid()) $$,
  '42501', null,
  'member cannot create performances'
);
select is_empty(
  $$ update public.performances set title = 'Hacked' returning id $$,
  'member cannot update performances'
);
select is_empty(
  $$ delete from public.performances returning id $$,
  'member cannot delete performances'
);
select lives_ok(
  $$ insert into public.performance_responses (performance_id, user_id, response)
     values ('c0000000-0000-0000-0000-000000000001', auth.uid(), 'yes') $$,
  'member can respond to a performance'
);
select throws_ok(
  $$ insert into public.performance_responses (performance_id, user_id, response)
     values ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'no') $$,
  '42501', null,
  'member cannot respond for someone else'
);
select is(
  (select count(*)::int from public.performance_responses),
  1,
  'member only sees own responses'
);
select is_empty(
  $$ update public.bands set name = 'Hacked' returning id $$,
  'member cannot update band'
);
select is_empty(
  $$ select id from public.band_invites $$,
  'member cannot see invites'
);
select throws_ok(
  $$ select public.set_band_member_role('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'admin') $$,
  'P0001', 'Insufficient permissions',
  'member cannot change roles'
);
select throws_ok(
  $$ select public.regenerate_band_invite('b0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Insufficient permissions',
  'member cannot create invites'
);
select lives_ok(
  $$ insert into public.performance_messages (performance_id, user_id, body)
     values ('c0000000-0000-0000-0000-000000000001', auth.uid(), 'Hallo') $$,
  'member can post message on published performance'
);
select throws_ok(
  $$ insert into public.performance_messages (performance_id, user_id, body)
     values ('c0000000-0000-0000-0000-000000000002', auth.uid(), 'Hallo') $$,
  '42501', null,
  'member cannot post message on draft performance'
);

-- Planner

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.performances),
  2,
  'planner sees draft performances'
);
select lives_ok(
  $$ insert into public.performances (band_id, title, performance_date, start_time, location, created_by, updated_by)
     values ('b0000000-0000-0000-0000-000000000001', 'Nieuw', current_date, '20:00', 'X', auth.uid(), auth.uid()) $$,
  'planner can create performances'
);
select isnt_empty(
  $$ update public.performances set title = 'Bijgewerkt' where id = 'c0000000-0000-0000-0000-000000000002' returning id $$,
  'planner can update performances'
);
select is(
  (select count(*)::int from public.performance_responses),
  2,
  'planner sees all responses'
);
select is_empty(
  $$ update public.bands set name = 'Planner' returning id $$,
  'planner cannot update band'
);
select throws_ok(
  $$ select public.get_band_members('b0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Insufficient permissions',
  'planner cannot list band member management data'
);

-- Admin

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select isnt_empty(
  $$ update public.bands set description = 'Admin' returning id $$,
  'admin can update band'
);
select lives_ok(
  $$ select public.set_band_member_role('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'planner') $$,
  'admin can promote member to planner'
);
select throws_ok(
  $$ select public.set_band_member_role('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'owner') $$,
  'P0001', 'Admins cannot assign owner role',
  'admin cannot assign owner role'
);
select throws_ok(
  $$ select public.deactivate_band_member('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Admins cannot deactivate owners',
  'admin cannot deactivate owner'
);
select lives_ok(
  $$ select public.regenerate_band_invite('b0000000-0000-0000-0000-000000000001') $$,
  'admin can create invite'
);

-- Owner

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select throws_ok(
  $$ select public.leave_band('b0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Last owner cannot leave band',
  'last owner cannot leave band'
);
select lives_ok(
  $$ select public.set_band_member_role('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'owner') $$,
  'owner can assign owner role'
);

-- Outsider

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000005","role":"authenticated"}', true);

select is_empty($$ select id from public.bands $$, 'outsider cannot see band');
select is_empty($$ select id from public.performances $$, 'outsider cannot see performances');
select is_empty($$ select id from public.band_members $$, 'outsider cannot see members');

-- Superadmin

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000006","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.performances where band_id = 'b0000000-0000-0000-0000-000000000001'),
  3,
  'superadmin sees all performances without membership'
);

-- Anonymous

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is_empty($$ select id from public.performances $$, 'anon cannot see performances');

select * from finish();

rollback;
