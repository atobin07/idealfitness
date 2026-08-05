-- Admin-authored polls to capture member feedback. Members vote; results are
-- shown live so the gym can respond to what members want.
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text,
  status text not null default 'open',        -- 'open' | 'closed'
  allow_multiple boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists poll_options_poll_idx on public.poll_options (poll_id, sort);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (option_id, user_id)
);
create index if not exists poll_votes_poll_idx on public.poll_votes (poll_id);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

-- Everyone reads polls & results; only admins author polls.
create policy "polls readable" on public.polls for select to authenticated using (true);
create policy "admins manage polls" on public.polls for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "poll options readable" on public.poll_options for select to authenticated using (true);
create policy "admins manage poll options" on public.poll_options for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Members cast/retract their own votes.
create policy "poll votes readable" on public.poll_votes for select to authenticated using (true);
create policy "vote as self" on public.poll_votes for insert to authenticated with check (user_id = auth.uid());
create policy "unvote as self" on public.poll_votes for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.polls to authenticated;
grant select, insert, update, delete on public.poll_options to authenticated;
grant select, insert, update, delete on public.poll_votes to authenticated;
