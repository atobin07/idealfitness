-- IdealFitness Hub — initial schema
-- Roles: 'trainer' and 'client'. Trainers get the operations/admin surface.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('trainer', 'client');
create type session_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type relationship_status as enum ('active', 'inactive');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'client',
  full_name   text not null default '',
  email       text,
  phone       text,
  avatar_url  text,
  bio         text,
  goals       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Helper: read the current user's role without tripping profile RLS recursion.
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Auto-create a profile whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- trainer_clients — assignment of clients to trainers
-- ---------------------------------------------------------------------------
create table public.trainer_clients (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  status      relationship_status not null default 'active',
  created_at  timestamptz not null default now(),
  unique (trainer_id, client_id)
);

-- ---------------------------------------------------------------------------
-- availability — recurring weekly availability windows for trainers
-- ---------------------------------------------------------------------------
create table public.availability (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),
  check (end_time > start_time)
);

-- ---------------------------------------------------------------------------
-- sessions — the calendar / bookings
-- ---------------------------------------------------------------------------
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid references public.profiles(id) on delete set null,
  title       text not null default 'Training session',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      session_status not null default 'scheduled',
  location    text,
  notes       text,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index sessions_trainer_starts_idx on public.sessions (trainer_id, starts_at);
create index sessions_client_starts_idx  on public.sessions (client_id, starts_at);

-- ---------------------------------------------------------------------------
-- messages — 1:1 direct messages
-- ---------------------------------------------------------------------------
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  body          text not null check (char_length(body) > 0),
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index messages_pair_idx on public.messages (sender_id, recipient_id, created_at);

-- ---------------------------------------------------------------------------
-- announcements — gym-wide, authored by trainers
-- ---------------------------------------------------------------------------
create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- client_progress — measurements / progress log
-- ---------------------------------------------------------------------------
create table public.client_progress (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.profiles(id) on delete cascade,
  recorded_by  uuid not null references public.profiles(id) on delete cascade,
  recorded_at  date not null default current_date,
  weight_kg    numeric(5,2),
  body_fat_pct numeric(4,1),
  notes        text,
  metrics      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index client_progress_client_idx on public.client_progress (client_id, recorded_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.trainer_clients  enable row level security;
alter table public.availability     enable row level security;
alter table public.sessions         enable row level security;
alter table public.messages         enable row level security;
alter table public.announcements    enable row level security;
alter table public.client_progress  enable row level security;

-- profiles: everyone signed in can read the directory; you edit only your own.
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated using (true);

create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated with check (id = auth.uid());

create policy "users update their own profile"
  on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- trainer_clients: each side sees its own links; trainers manage them.
create policy "see own trainer-client links"
  on public.trainer_clients for select
  to authenticated using (trainer_id = auth.uid() or client_id = auth.uid());

create policy "trainers manage their client links"
  on public.trainer_clients for all
  to authenticated
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- availability: anyone signed in can read (to book); trainers manage their own.
create policy "availability readable by authenticated users"
  on public.availability for select
  to authenticated using (true);

create policy "trainers manage their availability"
  on public.availability for all
  to authenticated
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- sessions: visible to the trainer or client on the booking.
create policy "see own sessions"
  on public.sessions for select
  to authenticated using (trainer_id = auth.uid() or client_id = auth.uid());

create policy "create sessions you are part of"
  on public.sessions for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (trainer_id = auth.uid() or client_id = auth.uid())
  );

create policy "update own sessions"
  on public.sessions for update
  to authenticated
  using (trainer_id = auth.uid() or client_id = auth.uid())
  with check (trainer_id = auth.uid() or client_id = auth.uid());

create policy "delete own sessions"
  on public.sessions for delete
  to authenticated using (trainer_id = auth.uid() or client_id = auth.uid());

-- messages: only the two parties can see them; you send as yourself.
create policy "see own messages"
  on public.messages for select
  to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "send messages as yourself"
  on public.messages for insert
  to authenticated with check (sender_id = auth.uid());

create policy "mark received messages read"
  on public.messages for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- announcements: everyone reads; only trainers create/manage their own.
create policy "announcements readable by authenticated users"
  on public.announcements for select
  to authenticated using (true);

create policy "trainers create announcements"
  on public.announcements for insert
  to authenticated
  with check (author_id = auth.uid() and public.current_user_role() = 'trainer');

create policy "authors manage their announcements"
  on public.announcements for update
  to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "authors delete their announcements"
  on public.announcements for delete
  to authenticated using (author_id = auth.uid());

-- client_progress: the client sees theirs; the recorder (trainer) sees/manages theirs.
create policy "see relevant progress"
  on public.client_progress for select
  to authenticated using (client_id = auth.uid() or recorded_by = auth.uid());

create policy "record progress as yourself"
  on public.client_progress for insert
  to authenticated with check (recorded_by = auth.uid());

create policy "update progress you recorded"
  on public.client_progress for update
  to authenticated using (recorded_by = auth.uid()) with check (recorded_by = auth.uid());

create policy "delete progress you recorded"
  on public.client_progress for delete
  to authenticated using (recorded_by = auth.uid());
