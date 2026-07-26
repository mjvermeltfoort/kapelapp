create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_text_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'profiles' then
    new.email = trim(new.email);
    new.display_name = nullif(trim(coalesce(new.display_name, '')), '');
  elsif tg_table_name = 'bands' then
    new.name = trim(new.name);
    new.description = nullif(trim(coalesce(new.description, '')), '');
  elsif tg_table_name = 'band_members' then
    new.instrument = nullif(trim(coalesce(new.instrument, '')), '');
  elsif tg_table_name = 'band_invites' then
    new.token_hash = trim(new.token_hash);
  elsif tg_table_name = 'performances' then
    new.title = trim(new.title);
    new.description = nullif(trim(coalesce(new.description, '')), '');
    new.location = trim(new.location);
    new.map_url = nullif(trim(coalesce(new.map_url, '')), '');
  elsif tg_table_name = 'performance_responses' then
    new.reason = nullif(trim(coalesce(new.reason, '')), '');
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists bands_set_updated_at on public.bands;
create trigger bands_set_updated_at
before update on public.bands
for each row
execute function public.set_updated_at();

drop trigger if exists band_members_set_updated_at on public.band_members;
create trigger band_members_set_updated_at
before update on public.band_members
for each row
execute function public.set_updated_at();

drop trigger if exists band_invites_set_updated_at on public.band_invites;
create trigger band_invites_set_updated_at
before update on public.band_invites
for each row
execute function public.set_updated_at();

drop trigger if exists performances_set_updated_at on public.performances;
create trigger performances_set_updated_at
before update on public.performances
for each row
execute function public.set_updated_at();

drop trigger if exists performance_responses_set_updated_at on public.performance_responses;
create trigger performance_responses_set_updated_at
before update on public.performance_responses
for each row
execute function public.set_updated_at();

drop trigger if exists profiles_normalize_text_fields on public.profiles;
create trigger profiles_normalize_text_fields
before insert or update on public.profiles
for each row
execute function public.normalize_text_fields();

drop trigger if exists bands_normalize_text_fields on public.bands;
create trigger bands_normalize_text_fields
before insert or update on public.bands
for each row
execute function public.normalize_text_fields();

drop trigger if exists band_members_normalize_text_fields on public.band_members;
create trigger band_members_normalize_text_fields
before insert or update on public.band_members
for each row
execute function public.normalize_text_fields();

drop trigger if exists band_invites_normalize_text_fields on public.band_invites;
create trigger band_invites_normalize_text_fields
before insert or update on public.band_invites
for each row
execute function public.normalize_text_fields();

drop trigger if exists performances_normalize_text_fields on public.performances;
create trigger performances_normalize_text_fields
before insert or update on public.performances
for each row
execute function public.normalize_text_fields();

drop trigger if exists performance_responses_normalize_text_fields on public.performance_responses;
create trigger performance_responses_normalize_text_fields
before insert or update on public.performance_responses
for each row
execute function public.normalize_text_fields();
