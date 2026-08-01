-- Demo social data so the Community hub, leaderboards, feed, challenges,
-- duels and partner goals have life before real members roll in.
-- Idempotent: safe to re-run (guards on natural keys / titles).

do $$
declare
  alex uuid; amy uuid; ben uuid;
  ch uuid; pg uuid;
begin
  select id into alex from profiles where role = 'trainer' order by created_at limit 1;
  select id into amy from profiles where full_name = 'Amy Chen' limit 1;
  select id into ben from profiles where full_name = 'Ben Okafor' limit 1;
  if amy is null or ben is null then return; end if;

  -- Denormalized stats.
  insert into member_stats (user_id, total_points, level, current_streak, longest_streak, last_checkin_date, checkins_count) values
    (amy, 1240, 3, 8, 12, current_date, 26),
    (ben, 680, 2, 4, 9, current_date, 12)
  on conflict (user_id) do update set
    total_points = excluded.total_points, level = excluded.level,
    current_streak = excluded.current_streak, longest_streak = excluded.longest_streak,
    last_checkin_date = excluded.last_checkin_date, checkins_count = excluded.checkins_count;
  if alex is not null then
    insert into member_stats (user_id, total_points, level, current_streak, longest_streak, last_checkin_date, checkins_count)
    values (alex, 900, 2, 5, 10, current_date, 18)
    on conflict (user_id) do update set total_points = excluded.total_points, level = excluded.level,
      current_streak = excluded.current_streak, longest_streak = excluded.longest_streak,
      last_checkin_date = excluded.last_checkin_date, checkins_count = excluded.checkins_count;
  end if;

  -- A trail of recent check-ins (feeds counts / calendars).
  insert into checkins (user_id, checkin_date)
  select amy, current_date - g from generate_series(0, 5) g on conflict do nothing;
  insert into checkins (user_id, checkin_date)
  select ben, current_date - g from generate_series(0, 3) g on conflict do nothing;

  -- Points ledger entries so history looks real.
  insert into points_ledger (user_id, points, reason, created_at) values
    (amy, 10, 'checkin', now() - interval '2 hours'),
    (amy, 25, 'session', now() - interval '1 day'),
    (amy, 15, 'checkin', now() - interval '2 days'),
    (ben, 10, 'checkin', now() - interval '3 hours'),
    (ben, 10, 'workout', now() - interval '1 day');

  -- Award badges based on the stats above.
  perform check_badges(amy);
  perform check_badges(ben);
  if alex is not null then perform check_badges(alex); end if;

  -- Public activity feed.
  insert into activity_events (user_id, type, title, body, visibility, created_at) values
    (amy, 'checkin', 'Checked in at the gym · 8-day streak 🔥', null, 'public', now() - interval '2 hours'),
    (amy, 'session', 'Completed a training session 💪', null, 'public', now() - interval '1 day'),
    (ben, 'checkin', 'Checked in at the gym', null, 'public', now() - interval '3 hours'),
    (ben, 'workout', 'Logged a workout', 'Upper body push day', 'public', now() - interval '1 day');

  -- Friendship.
  insert into friendships (requester_id, addressee_id, status)
  values (amy, ben, 'accepted') on conflict (requester_id, addressee_id) do nothing;

  -- A gym-wide challenge everyone can chase.
  if not exists (select 1 from challenges where title = 'August Check-in Challenge') then
    insert into challenges (title, description, metric, starts_at, ends_at, reward_points, created_by)
    values ('August Check-in Challenge', 'Most gym check-ins this month wins bragging rights and 250 points.',
            'checkins', date_trunc('day', now()) - interval '3 days', date_trunc('day', now()) + interval '25 days',
            250, coalesce(alex, amy))
    returning id into ch;
    insert into challenge_participants (challenge_id, user_id) values (ch, amy), (ch, ben) on conflict do nothing;
  end if;

  -- A head-to-head duel.
  if not exists (select 1 from duels where challenger_id = amy and opponent_id = ben and status = 'active') then
    insert into duels (challenger_id, opponent_id, metric, starts_at, ends_at, status)
    values (amy, ben, 'checkins', now() - interval '2 days', now() + interval '5 days', 'active');
  end if;

  -- A shared partner goal.
  if not exists (select 1 from partner_goals where title = '50 Summer Check-ins') then
    insert into partner_goals (title, metric, target, starts_at, ends_at, created_by)
    values ('50 Summer Check-ins', 'checkins', 50, now() - interval '5 days', now() + interval '30 days', amy)
    returning id into pg;
    insert into partner_goal_members (goal_id, user_id) values (pg, amy), (pg, ben) on conflict do nothing;
  end if;
end $$;
