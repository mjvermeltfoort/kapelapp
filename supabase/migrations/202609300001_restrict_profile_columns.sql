revoke insert, update on public.profiles from anon, authenticated;

grant insert (id, email) on public.profiles to authenticated;
grant update (email, display_name) on public.profiles to authenticated;
