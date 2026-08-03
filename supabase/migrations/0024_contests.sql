-- Gym-wide contests: an admin creates one (title, what it is, the prize, dates)
-- and any member can opt in. Distinct from `challenges` (auto-scored metric
-- leaderboards) — contests are admin-authored with a written prize and simple
-- opt-in participation.
create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  prize text,
  starts_at date,
  ends_at date,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.contests enable row level security;
create policy "contests readable" on public.contests for select using (true);
create policy "admins manage contests" on public.contests for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.contest_entries (
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);
alter table public.contest_entries enable row level security;
create policy "contest entries readable" on public.contest_entries for select using (true);
create policy "join contest as self" on public.contest_entries for insert with check (user_id = auth.uid());
create policy "leave contest as self" on public.contest_entries for delete using (user_id = auth.uid());
create policy "admins manage contest entries" on public.contest_entries for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.contests to authenticated;
grant select, insert, update, delete on public.contest_entries to authenticated;
