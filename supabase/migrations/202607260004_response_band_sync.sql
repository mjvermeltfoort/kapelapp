create or replace function public.sync_response_band_id()
returns trigger
language plpgsql
as $$
declare
  v_band_id uuid;
begin
  select band_id
    into v_band_id
  from public.performances
  where id = new.performance_id;

  if v_band_id is null then
    raise exception 'Unknown performance_id: %', new.performance_id;
  end if;

  new.band_id = v_band_id;
  new.responded_at = now();

  if new.response = 'yes' then
    new.reason = null;
  end if;

  return new;
end;
$$;

drop trigger if exists performance_responses_sync_band_id on public.performance_responses;
create trigger performance_responses_sync_band_id
before insert or update on public.performance_responses
for each row
execute function public.sync_response_band_id();
