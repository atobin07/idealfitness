-- Fully-developed contests: parameters & rules, rule keepers who record
-- scores, a computed leaderboard, and social cheers (congrats/fistbump/cheer).

alter table public.contests
  add column if not exists metric text,
  add column if not exists unit text,
  add column if not exists scoring text not null default 'high',  -- 'high' = higher wins, 'low' = lower wins
  add column if not exists rules text;

-- People (besides gym admins) allowed to record scores and manage a contest.
create table if not exists public.contest_rule_keepers (
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);

-- Scores recorded by rule keepers / admins for participants.
create table if not exists public.contest_scores (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  value numeric not null,
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists contest_scores_idx on public.contest_scores (contest_id, participant_id);

-- Social cheers on a participant within a contest.
create table if not exists public.contest_cheers (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  kind text not null,  -- 'congrats' | 'fistbump' | 'cheer'
  created_at timestamptz not null default now(),
  unique (contest_id, from_user, to_user, kind)
);
create index if not exists contest_cheers_idx on public.contest_cheers (contest_id, to_user);

-- Is the caller allowed to keep score for this contest?
create or replace function public.is_contest_keeper(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (select 1 from contests c where c.id = cid and c.created_by = auth.uid())
      or exists (select 1 from contest_rule_keepers k where k.contest_id = cid and k.user_id = auth.uid());
$$;

alter table public.contest_rule_keepers enable row level security;
alter table public.contest_scores enable row level security;
alter table public.contest_cheers enable row level security;

-- Rule keepers: everyone can see who they are; keepers/admins manage the roster.
create policy "rule keepers readable" on public.contest_rule_keepers for select to authenticated using (true);
create policy "keepers manage keepers" on public.contest_rule_keepers for insert to authenticated with check (public.is_contest_keeper(contest_id));
create policy "keepers remove keepers" on public.contest_rule_keepers for delete to authenticated using (public.is_contest_keeper(contest_id));

-- Scores: everyone reads the board; only keepers/admins write.
create policy "scores readable" on public.contest_scores for select to authenticated using (true);
create policy "keepers record scores" on public.contest_scores for insert to authenticated with check (public.is_contest_keeper(contest_id) and recorded_by = auth.uid());
create policy "keepers edit scores" on public.contest_scores for update to authenticated using (public.is_contest_keeper(contest_id)) with check (public.is_contest_keeper(contest_id));
create policy "keepers delete scores" on public.contest_scores for delete to authenticated using (public.is_contest_keeper(contest_id));

-- Cheers: everyone reads; you give/take your own cheers.
create policy "cheers readable" on public.contest_cheers for select to authenticated using (true);
create policy "give own cheer" on public.contest_cheers for insert to authenticated with check (from_user = auth.uid());
create policy "take own cheer" on public.contest_cheers for delete to authenticated using (from_user = auth.uid());

-- Let rule keepers (not just admins) update their contest's rules/status.
drop policy if exists "keepers update contests" on public.contests;
create policy "keepers update contests" on public.contests for update to authenticated using (public.is_contest_keeper(id)) with check (public.is_contest_keeper(id));

grant select, insert, update, delete on public.contest_rule_keepers to authenticated;
grant select, insert, update, delete on public.contest_scores to authenticated;
grant select, insert, update, delete on public.contest_cheers to authenticated;
