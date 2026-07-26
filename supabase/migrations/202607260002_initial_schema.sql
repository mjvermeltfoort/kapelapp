create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank
    check (display_name is null or length(trim(display_name)) > 0)
);

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  show_member_responses boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bands_name_not_blank check (length(trim(name)) > 0)
);

create index if not exists bands_created_by_idx on public.bands (created_by);

create table if not exists public.band_members (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  instrument text null,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint band_members_role_check
    check (role in ('member', 'planner', 'admin', 'owner')),
  constraint band_members_instrument_not_blank
    check (instrument is null or length(trim(instrument)) > 0),
  constraint band_members_active_left_at_check
    check ((is_active and left_at is null) or (not is_active)),
  constraint band_members_band_user_unique unique (band_id, user_id)
);

create index if not exists band_members_user_active_idx
  on public.band_members (user_id, is_active);

create index if not exists band_members_band_role_active_idx
  on public.band_members (band_id, role, is_active);

create table if not exists public.band_invites (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  role text not null default 'member',
  token_hash text not null,
  is_active boolean not null default true,
  expires_at timestamptz null,
  max_uses integer null,
  use_count integer not null default 0,
  last_used_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint band_invites_role_check
    check (role in ('member', 'planner', 'admin', 'owner')),
  constraint band_invites_max_uses_check
    check (max_uses is null or max_uses > 0),
  constraint band_invites_use_count_check
    check (use_count >= 0)
);

create unique index if not exists band_invites_token_hash_idx
  on public.band_invites (token_hash);

create index if not exists band_invites_band_active_idx
  on public.band_invites (band_id, is_active);

create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  title text not null,
  description text null,
  performance_date date not null,
  start_time time not null,
  end_time time null,
  gather_time time null,
  location text not null,
  map_url text null,
  response_deadline timestamptz null,
  status text not null default 'draft',
  cancelled_at timestamptz null,
  archived_at timestamptz null,
  created_by uuid not null references public.profiles (id),
  updated_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint performances_status_check
    check (status in ('draft', 'published', 'cancelled', 'completed', 'archived')),
  constraint performances_title_not_blank check (length(trim(title)) > 0),
  constraint performances_location_not_blank check (length(trim(location)) > 0),
  constraint performances_end_time_check
    check (end_time is null or end_time >= start_time),
  constraint performances_gather_time_check
    check (gather_time is null or gather_time <= start_time),
  constraint performances_cancelled_status_check
    check ((status <> 'cancelled') or cancelled_at is not null),
  constraint performances_archived_status_check
    check ((status <> 'archived') or archived_at is not null)
);

create index if not exists performances_band_date_idx
  on public.performances (band_id, performance_date);

create index if not exists performances_band_status_date_idx
  on public.performances (band_id, status, performance_date);

create table if not exists public.performance_responses (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references public.performances (id) on delete cascade,
  band_id uuid not null references public.bands (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  response text not null,
  reason text null,
  responded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint performance_responses_unique unique (performance_id, user_id),
  constraint performance_responses_value_check
    check (response in ('yes', 'maybe', 'no')),
  constraint performance_responses_reason_check
    check (
      (response = 'yes' and reason is null)
      or (response = 'maybe' and reason is not null and length(trim(reason)) > 0)
      or (response = 'no')
    )
);

create index if not exists performance_responses_band_performance_response_idx
  on public.performance_responses (band_id, performance_id, response);

create index if not exists performance_responses_user_performance_idx
  on public.performance_responses (user_id, performance_id);
