-- Social / gamification layer: points, streaks, badges, leaderboards, challenges,
-- duels, partner goals, friends, and an activity feed with kudos.

create type challenge_metric as enum ('checkins', 'sessions', 'classes', 'workouts', 'points');
create type duel_status as enum ('pending', 'active', 'completed', 'declined', 'cancelled');

-- Points ledger (append-only source of truth for points earned).
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index points_ledger_user_idx on public.points_ledger (user_id, created_at);

-- Denormalized per-member stats (maintained by functions).
create table public.member_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_points integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_checkin_date date,
  checkins_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Gym check-ins (one per day per member).
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_date date not null default current_date,
  source text not null default 'self',
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- Badge definitions + earned badges.
create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null default 'star',
  points_reward integer not null default 0,
  sort integer not null default 0
);
create table public.member_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- Friendships (undirected via requester/addressee).
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- Activity feed + kudos.
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  visibility text not null default 'friends',
  created_at timestamptz not null default now()
);
create index activity_user_idx on public.activity_events (user_id, created_at desc);

create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activity_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

-- Challenges (gym-wide competitions).
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  metric challenge_metric not null default 'checkins',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reward_points integer not null default 100,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

-- Duels (1v1).
create table public.duels (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  opponent_id uuid not null references public.profiles(id) on delete cascade,
  metric challenge_metric not null default 'checkins',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status duel_status not null default 'pending',
  winner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- Partner goals (shared).
create table public.partner_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  metric challenge_metric not null default 'checkins',
  target numeric not null default 10,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.partner_goal_members (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.partner_goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (goal_id, user_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.points_ledger enable row level security;
alter table public.member_stats enable row level security;
alter table public.checkins enable row level security;
alter table public.badges enable row level security;
alter table public.member_badges enable row level security;
alter table public.friendships enable row level security;
alter table public.activity_events enable row level security;
alter table public.kudos enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.duels enable row level security;
alter table public.partner_goals enable row level security;
alter table public.partner_goal_members enable row level security;

create policy "see own points" on public.points_ledger for select to authenticated using (user_id = auth.uid());
create policy "member stats readable" on public.member_stats for select to authenticated using (true);
create policy "see own checkins" on public.checkins for select to authenticated using (user_id = auth.uid());
create policy "badges readable" on public.badges for select to authenticated using (true);
create policy "member badges readable" on public.member_badges for select to authenticated using (true);

create policy "see own friendships" on public.friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "request friendship" on public.friendships for insert to authenticated
  with check (requester_id = auth.uid());
create policy "respond to friendship" on public.friendships for update to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "remove friendship" on public.friendships for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "see feed" on public.activity_events for select to authenticated
  using (
    visibility = 'public'
    or user_id = auth.uid()
    or user_id in (
      select case when requester_id = auth.uid() then addressee_id else requester_id end
      from public.friendships
      where status = 'accepted' and (requester_id = auth.uid() or addressee_id = auth.uid())
    )
  );
create policy "kudos readable" on public.kudos for select to authenticated using (true);

create policy "challenges readable" on public.challenges for select to authenticated using (true);
create policy "manage own challenges" on public.challenges for all to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

create policy "participants readable" on public.challenge_participants for select to authenticated using (true);
create policy "join challenges" on public.challenge_participants for insert to authenticated with check (user_id = auth.uid());
create policy "leave challenges" on public.challenge_participants for delete to authenticated using (user_id = auth.uid());

create policy "see own duels" on public.duels for select to authenticated
  using (challenger_id = auth.uid() or opponent_id = auth.uid());
create policy "create duels" on public.duels for insert to authenticated with check (challenger_id = auth.uid());
create policy "update own duels" on public.duels for update to authenticated
  using (challenger_id = auth.uid() or opponent_id = auth.uid())
  with check (challenger_id = auth.uid() or opponent_id = auth.uid());

create policy "see own partner goals" on public.partner_goals for select to authenticated
  using (created_by = auth.uid() or id in (select goal_id from public.partner_goal_members where user_id = auth.uid()));
create policy "manage own partner goals" on public.partner_goals for all to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "see partner goal members" on public.partner_goal_members for select to authenticated
  using (user_id = auth.uid() or goal_id in (select id from public.partner_goals where created_by = auth.uid())
    or goal_id in (select goal_id from public.partner_goal_members where user_id = auth.uid()));
create policy "join partner goals" on public.partner_goal_members for insert to authenticated
  with check (user_id = auth.uid() or goal_id in (select id from public.partner_goals where created_by = auth.uid()));
create policy "leave partner goals" on public.partner_goal_members for delete to authenticated
  using (user_id = auth.uid() or goal_id in (select id from public.partner_goals where created_by = auth.uid()));

-- Seed badge catalog.
insert into public.badges (id, name, description, icon, points_reward, sort) values
  ('first_checkin', 'First Steps', 'Checked in for the first time.', 'flag', 20, 1),
  ('checkins_10',  'Getting Consistent', 'Checked in 10 times.', 'calendar', 40, 2),
  ('checkins_25',  'Regular', 'Checked in 25 times.', 'calendar', 75, 3),
  ('streak_7',     'On Fire', 'Reached a 7-day check-in streak.', 'fire', 50, 4),
  ('streak_30',    'Unstoppable', 'Reached a 30-day check-in streak.', 'fire', 200, 5),
  ('sessions_10',  'Committed', 'Completed 10 training sessions.', 'dumbbell', 75, 6),
  ('workouts_25',  'Grinder', 'Logged 25 workouts.', 'bolt', 75, 7),
  ('points_1000',  'Rising Star', 'Earned 1,000 points.', 'star', 0, 8),
  ('points_5000',  'Legend', 'Earned 5,000 points.', 'trophy', 0, 9)
on conflict (id) do nothing;
