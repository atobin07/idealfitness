-- Admin / coaching console: an admin capability on top of coaches, gym settings,
-- and admin-level access policies for gym-wide management.

-- Admin capability (an owner is a coach with is_admin = true). Kept as a flag so
-- it layers on top of the trainer role without touching existing role logic.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Helper: is the current user an admin? SECURITY DEFINER avoids RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
revoke execute on function public.is_admin() from anon;

-- Gym-wide settings (single row enforced by a constant primary key).
create table if not exists public.gym_settings (
  id          boolean primary key default true,
  name        text not null default 'iDEAL FITNESS',
  tagline     text,
  email       text,
  phone       text,
  address     text,
  city        text,
  timezone    text not null default 'America/New_York',
  currency    text not null default 'USD',
  booking_window_days smallint not null default 30,
  cancel_cutoff_hours smallint not null default 24,
  updated_at  timestamptz not null default now(),
  constraint gym_settings_singleton check (id)
);

alter table public.gym_settings enable row level security;
create policy "gym settings readable" on public.gym_settings for select to authenticated using (true);
create policy "admins update gym settings" on public.gym_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins insert gym settings" on public.gym_settings for insert to authenticated
  with check (public.is_admin());

-- Admin override policies for gym-wide management.
create policy "admins manage profiles" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admins manage all links" on public.trainer_clients for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admins read all sessions" on public.sessions for select to authenticated
  using (public.is_admin());

create policy "admins read all invoices" on public.invoices for select to authenticated
  using (public.is_admin());

create policy "admins read all client packages" on public.client_packages for select to authenticated
  using (public.is_admin());

create policy "admins read all goals" on public.goals for select to authenticated
  using (public.is_admin());

-- Seed: make the demo coach an owner/admin, and create the gym settings row.
update public.profiles set is_admin = true where email = 'alex@idealfitness.demo';

insert into public.gym_settings (id, name, tagline, email, phone, city)
values (true, 'iDEAL FITNESS', 'Your path to better health, strength, and fitness.',
        'hello@idealfitvb.com', '(757) 000-0000', 'Virginia Beach')
on conflict (id) do nothing;
