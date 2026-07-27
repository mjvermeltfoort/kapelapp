drop policy if exists performances_delete_planner_plus on public.performances;
create policy performances_delete_planner_plus
on public.performances
for delete
using (public.has_band_role(band_id, array['planner', 'admin', 'owner']));
