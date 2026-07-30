-- IdealFitness Hub — premium feature schema
-- Adds: exercise library, workout programs + assignments + logs, goals,
-- richer measurements, group classes + bookings/waitlist, packages + credits,
-- invoices, notifications (with triggers), and automatic credit deduction.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type assignment_status as enum ('active', 'completed', 'paused');
create type goal_status as enum ('active', 'achieved', 'archived');
create type class_booking_status as enum ('booked', 'waitlisted', 'cancelled', 'attended');
create type package_status as enum ('active', 'expired', 'cancelled');
create type invoice_status as enum ('due', 'paid', 'void');

-- ---------------------------------------------------------------------------
-- Richer body measurements (extend existing client_progress)
-- ---------------------------------------------------------------------------
alter table public.client_progress add column if not exists chest_cm  numeric(5,1);
alter table public.client_progress add column if not exists waist_cm  numeric(5,1);
alter table public.client_progress add column if not exists hips_cm   numeric(5,1);
alter table public.client_progress add column if not exists arms_cm   numeric(5,1);
alter table public.client_progress add column if not exists thighs_cm numeric(5,1);

-- ---------------------------------------------------------------------------
-- Exercise library
-- ---------------------------------------------------------------------------
create table public.exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,
  muscle_group text,
  equipment    text,
  description  text,
  video_url    text,
  created_by   uuid not null references public.profiles(id) on delete cascade,
  is_public    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Workout programs
-- ---------------------------------------------------------------------------
create table public.workout_plans (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  weeks       smallint not null default 4,
  created_at  timestamptz not null default now()
);

create table public.workout_plan_items (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.workout_plans(id) on delete cascade,
  day_label    text not null default 'Day 1',
  exercise_id  uuid references public.exercises(id) on delete set null,
  exercise_name text not null default '',
  position     smallint not null default 0,
  sets         smallint,
  reps         text,
  rest_seconds smallint,
  notes        text
);

create table public.workout_assignments (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.workout_plans(id) on delete cascade,
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  start_date  date not null default current_date,
  status      assignment_status not null default 'active',
  created_at  timestamptz not null default now()
);

create table public.workout_logs (
  id           uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.workout_assignments(id) on delete cascade,
  plan_item_id uuid references public.workout_plan_items(id) on delete set null,
  client_id    uuid not null references public.profiles(id) on delete cascade,
  performed_on date not null default current_date,
  sets_done    smallint,
  reps_done    text,
  weight_kg    numeric(6,2),
  notes        text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Goals
-- ---------------------------------------------------------------------------
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  trainer_id  uuid references public.profiles(id) on delete set null,
  title       text not null,
  description text,
  metric      text,
  unit        text,
  start_value numeric,
  target_value numeric,
  current_value numeric,
  target_date date,
  status      goal_status not null default 'active',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Group classes
-- ---------------------------------------------------------------------------
create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  capacity    smallint not null default 10,
  location    text,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.class_bookings (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  status      class_booking_status not null default 'booked',
  created_at  timestamptz not null default now(),
  unique (class_id, client_id)
);

-- ---------------------------------------------------------------------------
-- Packages + client credits
-- ---------------------------------------------------------------------------
create table public.packages (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  description   text,
  sessions_count smallint not null default 10,
  price_cents   integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.client_packages (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles(id) on delete cascade,
  trainer_id     uuid not null references public.profiles(id) on delete cascade,
  package_id     uuid references public.packages(id) on delete set null,
  name           text not null,
  sessions_total smallint not null default 0,
  sessions_used  smallint not null default 0,
  price_cents    integer not null default 0,
  status         package_status not null default 'active',
  purchased_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
create table public.invoices (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount_cents integer not null default 0,
  status      invoice_status not null default 'due',
  issued_at   timestamptz not null default now(),
  due_date    date,
  paid_at     timestamptz
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null default 'info',
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index classes_starts_idx on public.classes (starts_at);
create index class_bookings_class_idx on public.class_bookings (class_id);
create index workout_assignments_client_idx on public.workout_assignments (client_id);

-- ---------------------------------------------------------------------------
-- Helper: create a notification (SECURITY DEFINER so triggers bypass RLS)
-- ---------------------------------------------------------------------------
create or replace function public.notify(
  target uuid, ntype text, ntitle text, nbody text, nlink text
) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (target, ntype, ntitle, nbody, nlink);
$$;

-- New message -> notify recipient
create or replace function public.on_message_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare sender_name text;
begin
  select full_name into sender_name from public.profiles where id = new.sender_id;
  perform public.notify(new.recipient_id, 'message',
    coalesce(sender_name, 'Someone') || ' sent you a message',
    left(new.body, 120), '/messages?with=' || new.sender_id);
  return new;
end; $$;
create trigger trg_message_created after insert on public.messages
  for each row execute function public.on_message_created();

-- New session -> notify the counterpart
create or replace function public.on_session_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid; actor_name text;
begin
  target := case when new.created_by = new.trainer_id then new.client_id else new.trainer_id end;
  if target is null then return new; end if;
  select full_name into actor_name from public.profiles where id = new.created_by;
  perform public.notify(target, 'session',
    'New session booked',
    coalesce(actor_name, 'Someone') || ' booked "' || new.title || '"',
    '/calendar');
  return new;
end; $$;
create trigger trg_session_created after insert on public.sessions
  for each row execute function public.on_session_created();

-- New workout assignment -> notify client
create or replace function public.on_assignment_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare plan_name text;
begin
  select name into plan_name from public.workout_plans where id = new.plan_id;
  perform public.notify(new.client_id, 'workout',
    'New workout program assigned',
    coalesce(plan_name, 'A program') || ' was assigned to you', '/workouts');
  return new;
end; $$;
create trigger trg_assignment_created after insert on public.workout_assignments
  for each row execute function public.on_assignment_created();

-- New invoice -> notify client
create or replace function public.on_invoice_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.client_id, 'invoice',
    'New invoice',
    new.description || ' — $' || to_char(new.amount_cents / 100.0, 'FM999990.00'),
    '/billing');
  return new;
end; $$;
create trigger trg_invoice_created after insert on public.invoices
  for each row execute function public.on_invoice_created();

-- Session completed -> deduct one credit from an active client package
create or replace function public.on_session_completed()
returns trigger language plpgsql security definer set search_path = public as $$
declare pkg uuid;
begin
  if new.status = 'completed' and coalesce(old.status, '') <> 'completed'
     and new.client_id is not null then
    select id into pkg from public.client_packages
      where client_id = new.client_id and status = 'active'
        and sessions_used < sessions_total
      order by purchased_at asc limit 1;
    if pkg is not null then
      update public.client_packages set sessions_used = sessions_used + 1 where id = pkg;
    end if;
  end if;
  return new;
end; $$;
create trigger trg_session_completed after update on public.sessions
  for each row execute function public.on_session_completed();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.exercises            enable row level security;
alter table public.workout_plans        enable row level security;
alter table public.workout_plan_items   enable row level security;
alter table public.workout_assignments  enable row level security;
alter table public.workout_logs         enable row level security;
alter table public.goals                enable row level security;
alter table public.classes              enable row level security;
alter table public.class_bookings       enable row level security;
alter table public.packages             enable row level security;
alter table public.client_packages      enable row level security;
alter table public.invoices             enable row level security;
alter table public.notifications        enable row level security;

-- exercises: library readable by all signed-in; trainers manage their own
create policy "exercises readable" on public.exercises for select to authenticated using (true);
create policy "trainers manage exercises" on public.exercises for all to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- workout_plans: trainer owns; clients see plans assigned to them
create policy "see relevant plans" on public.workout_plans for select to authenticated
  using (trainer_id = auth.uid()
    or id in (select plan_id from public.workout_assignments where client_id = auth.uid()));
create policy "trainers manage plans" on public.workout_plans for all to authenticated
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- workout_plan_items: follow plan visibility
create policy "see relevant plan items" on public.workout_plan_items for select to authenticated
  using (plan_id in (select id from public.workout_plans where trainer_id = auth.uid())
    or plan_id in (select plan_id from public.workout_assignments where client_id = auth.uid()));
create policy "trainers manage plan items" on public.workout_plan_items for all to authenticated
  using (plan_id in (select id from public.workout_plans where trainer_id = auth.uid()))
  with check (plan_id in (select id from public.workout_plans where trainer_id = auth.uid()));

-- workout_assignments
create policy "see own assignments" on public.workout_assignments for select to authenticated
  using (trainer_id = auth.uid() or client_id = auth.uid());
create policy "trainers manage assignments" on public.workout_assignments for all to authenticated
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- workout_logs: client logs; trainer of the assignment can read
create policy "see relevant logs" on public.workout_logs for select to authenticated
  using (client_id = auth.uid()
    or assignment_id in (select id from public.workout_assignments where trainer_id = auth.uid()));
create policy "clients manage own logs" on public.workout_logs for all to authenticated
  using (client_id = auth.uid()) with check (client_id = auth.uid());

-- goals: shared between client + trainer, both may edit
create policy "see own goals" on public.goals for select to authenticated
  using (client_id = auth.uid() or trainer_id = auth.uid());
create policy "manage own goals" on public.goals for all to authenticated
  using (client_id = auth.uid() or trainer_id = auth.uid())
  with check (client_id = auth.uid() or trainer_id = auth.uid());

-- classes: readable by all signed-in; trainer manages own
create policy "classes readable" on public.classes for select to authenticated using (true);
create policy "trainers manage classes" on public.classes for all to authenticated
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- class_bookings: readable by all signed-in (for capacity); client books self; trainer manages
create policy "class bookings readable" on public.class_bookings for select to authenticated using (true);
create policy "clients book classes" on public.class_bookings for insert to authenticated
  with check (client_id = auth.uid());
create policy "manage own class bookings" on public.class_bookings for update to authenticated
  using (client_id = auth.uid()
    or class_id in (select id from public.classes where trainer_id = auth.uid()))
  with check (true);
create policy "delete own class bookings" on public.class_bookings for delete to authenticated
  using (client_id = auth.uid()
    or class_id in (select id from public.classes where trainer_id = auth.uid()));

-- packages: readable by all signed-in; trainer manages own
create policy "packages readable" on public.packages for select to authenticated using (true);
create policy "trainers manage packages" on public.packages for all to authenticated
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- client_packages: client + trainer see; trainer manages
create policy "see own client packages" on public.client_packages for select to authenticated
  using (client_id = auth.uid() or trainer_id = auth.uid());
create policy "trainers manage client packages" on public.client_packages for all to authenticated
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- invoices: client + trainer see; trainer manages
create policy "see own invoices" on public.invoices for select to authenticated
  using (client_id = auth.uid() or trainer_id = auth.uid());
create policy "trainers manage invoices" on public.invoices for all to authenticated
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- notifications: you see + manage your own (created via SECURITY DEFINER triggers)
create policy "see own notifications" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "update own notifications" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete to authenticated
  using (user_id = auth.uid());
