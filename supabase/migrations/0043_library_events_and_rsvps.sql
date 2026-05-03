-- 모임서가 일정·이벤트 및 멤버 RSVP(참석/불참/미정/미응답).

create table if not exists public.library_events (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  title text not null,
  description text,
  location text,
  event_kind text not null default 'meeting'
    check (event_kind in ('meeting', 'social', 'deadline')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid not null references public.app_users (id) on delete cascade,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint library_events_ends_after_starts
    check (ends_at is null or ends_at >= starts_at)
);

create index if not exists idx_library_events_library_starts
  on public.library_events (library_id, starts_at desc);

create index if not exists idx_library_events_starts_at
  on public.library_events (starts_at);

drop trigger if exists set_library_events_updated_at on public.library_events;
create trigger set_library_events_updated_at
  before update on public.library_events
  for each row execute procedure public.set_updated_at();

create table if not exists public.library_event_rsvps (
  library_event_id uuid not null references public.library_events (id) on delete cascade,
  user_id uuid not null references public.app_users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('going', 'maybe', 'declined', 'pending')),
  note text,
  updated_at timestamptz not null default now(),
  primary key (library_event_id, user_id)
);

create index if not exists idx_library_event_rsvps_user_id
  on public.library_event_rsvps (user_id);

drop trigger if exists set_library_event_rsvps_updated_at on public.library_event_rsvps;
create trigger set_library_event_rsvps_updated_at
  before update on public.library_event_rsvps
  for each row execute procedure public.set_updated_at();

alter table public.library_events enable row level security;
alter table public.library_event_rsvps enable row level security;

comment on table public.library_events is '모임서가 일정·이벤트(단발).';
comment on table public.library_event_rsvps is '모임 일정별 멤버 참석 응답.';
comment on column public.library_events.cancelled_at is '비NULL이면 취소된 일정(캘린더에서 제외 권장).';
comment on column public.library_event_rsvps.status is 'going|maybe|declined|pending(미응답).';

-- 기간과 겹치는 일정만 반환 (`ends_at` NULL이면 `starts_at`만의 시점으로 간주).
create or replace function public.list_library_events_in_range(
  p_library_id uuid,
  p_range_start timestamptz,
  p_range_end_exclusive timestamptz
)
returns setof public.library_events
language sql
stable
as $$
  select e.*
  from public.library_events e
  where e.library_id = p_library_id
    and e.cancelled_at is null
    and e.starts_at < p_range_end_exclusive
    and (e.ends_at is null or e.ends_at >= p_range_start);
$$;

comment on function public.list_library_events_in_range(uuid, timestamptz, timestamptz) is
  '모임서가 일정 중 구간과 시간 겹침이 있는 행만 반환.';

grant execute on function public.list_library_events_in_range(uuid, timestamptz, timestamptz) to service_role;
