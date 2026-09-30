begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

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

insert into public.performance_responses (performance_id, user_id, response, reason) values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'maybe', 'Werk');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select throws_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Insufficient permissions', 'member cannot read responses when sharing is disabled'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'planner can read published responses when sharing is disabled'
);
select lives_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000002') $$,
  'planner can read draft overview'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'admin can read responses when sharing is disabled'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'owner can read responses when sharing is disabled'
);
update public.bands set show_member_responses = true where id = 'b0000000-0000-0000-0000-000000000001';

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is(
  (public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001')->'counts'->>'yes')::int,
  1, 'member can read response counts when sharing is enabled'
);
select is(
  public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001')->'maybe'->0->>'reason',
  'Werk', 'authorized overview preserves response reasons'
);
select throws_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000002') $$,
  'P0001', 'Insufficient permissions', 'sharing does not expose draft performances to members'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
update public.bands set show_member_responses = false where id = 'b0000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select throws_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Insufficient permissions', 'disabling sharing immediately blocks new overview requests'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
update public.bands set show_member_responses = true where id = 'b0000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select throws_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Insufficient permissions', 'outsider cannot use a known performance id when sharing is enabled'
);

reset role;
update public.band_members set is_active = false, left_at = now()
where user_id = '00000000-0000-0000-0000-000000000007';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select throws_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Insufficient permissions', 'inactive member cannot read shared responses'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Authentication required', 'anonymous calls are rejected'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select lives_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000001') $$,
  'superadmin can read responses without a membership'
);
select lives_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000002') $$,
  'superadmin can read a draft without a membership'
);
select throws_ok(
  $$ select public.get_performance_response_overview('c0000000-0000-0000-0000-000000000099') $$,
  'P0001', 'Performance not found', 'unknown performance is rejected'
);

select * from finish();
rollback;
