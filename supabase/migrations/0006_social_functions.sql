-- Social engine: scoring, points, check-ins, badges, kudos, duels, and hooks.

-- Count a member's activity for a metric within a window.
create or replace function public.metric_score(uid uuid, m challenge_metric, s timestamptz, e timestamptz)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(case m
    when 'checkins' then (select count(*) from checkins where user_id = uid and created_at >= s and created_at < e)
    when 'sessions' then (select count(*) from sessions where client_id = uid and status = 'completed' and starts_at >= s and starts_at < e)
    when 'classes'  then (select count(*) from class_bookings b join classes c on c.id = b.class_id
                          where b.client_id = uid and b.status <> 'cancelled' and c.starts_at >= s and c.starts_at < e)
    when 'workouts' then (select count(*) from workout_logs where client_id = uid and created_at >= s and created_at < e)
    when 'points'   then (select coalesce(sum(points),0) from points_ledger where user_id = uid and created_at >= s and created_at < e)
  end, 0)::integer;
$$;

create or replace function public.award_points(uid uuid, pts integer, p_reason text, rtype text default null, rid uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into points_ledger (user_id, points, reason, ref_type, ref_id) values (uid, coalesce(pts,0), p_reason, rtype, rid);
  insert into member_stats (user_id, total_points) values (uid, coalesce(pts,0))
    on conflict (user_id) do update set total_points = member_stats.total_points + coalesce(pts,0), updated_at = now();
  update member_stats set level = 1 + floor(total_points / 500.0)::int where user_id = uid;
end $$;

create or replace function public.add_activity(uid uuid, atype text, atitle text, abody text, vis text default 'friends')
returns void language sql security definer set search_path = public as $$
  insert into activity_events (user_id, type, title, body, visibility) values (uid, atype, atitle, abody, vis);
$$;

create or replace function public.check_badges(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_checkins int; v_streak int; v_points int; v_sessions int; v_workouts int; b record; earned boolean; ok boolean;
begin
  select coalesce(checkins_count,0), coalesce(current_streak,0), coalesce(total_points,0)
    into v_checkins, v_streak, v_points from member_stats where user_id = uid;
  v_checkins := coalesce(v_checkins,0); v_streak := coalesce(v_streak,0); v_points := coalesce(v_points,0);
  select count(*) into v_sessions from sessions where client_id = uid and status = 'completed';
  select count(*) into v_workouts from workout_logs where client_id = uid;
  for b in select * from badges loop
    select exists(select 1 from member_badges where user_id = uid and badge_id = b.id) into earned;
    if earned then continue; end if;
    ok := case b.id
      when 'first_checkin' then v_checkins >= 1
      when 'checkins_10' then v_checkins >= 10
      when 'checkins_25' then v_checkins >= 25
      when 'streak_7' then v_streak >= 7
      when 'streak_30' then v_streak >= 30
      when 'sessions_10' then v_sessions >= 10
      when 'workouts_25' then v_workouts >= 25
      when 'points_1000' then v_points >= 1000
      when 'points_5000' then v_points >= 5000
      else false end;
    if ok then
      insert into member_badges (user_id, badge_id) values (uid, b.id) on conflict do nothing;
      if b.points_reward > 0 then perform award_points(uid, b.points_reward, 'badge', 'badge', null); end if;
      perform add_activity(uid, 'badge', 'Earned the "' || b.name || '" badge', b.description, 'friends');
    end if;
  end loop;
end $$;

create or replace function public.do_checkin()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); today date := current_date; last date; streak int; bonus int := 0;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from checkins where user_id = uid and checkin_date = today) then
    select current_streak into streak from member_stats where user_id = uid;
    return json_build_object('already', true, 'streak', coalesce(streak,0), 'points', 0);
  end if;
  insert into checkins (user_id, checkin_date) values (uid, today);
  insert into member_stats (user_id) values (uid) on conflict (user_id) do nothing;
  select last_checkin_date, current_streak into last, streak from member_stats where user_id = uid;
  if last = today - 1 then streak := coalesce(streak,0) + 1; else streak := 1; end if;
  update member_stats set last_checkin_date = today, current_streak = streak,
    longest_streak = greatest(longest_streak, streak), checkins_count = checkins_count + 1, updated_at = now()
    where user_id = uid;
  if streak = 30 then bonus := 50; elsif streak > 0 and streak % 7 = 0 then bonus := 15; end if;
  perform award_points(uid, 10 + bonus, 'checkin', 'checkin', null);
  perform add_activity(uid, 'checkin',
    'Checked in at the gym' || case when streak > 1 then ' · ' || streak || '-day streak 🔥' else '' end, null, 'friends');
  perform check_badges(uid);
  return json_build_object('already', false, 'streak', streak, 'points', 10 + bonus);
end $$;

create or replace function public.give_kudos(p_activity uuid)
returns void language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if exists (select 1 from kudos where activity_id = p_activity and user_id = auth.uid()) then return; end if;
  insert into kudos (activity_id, user_id) values (p_activity, auth.uid());
  select user_id into owner from activity_events where id = p_activity;
  if owner is not null and owner <> auth.uid() then perform award_points(owner, 2, 'kudos', 'activity', p_activity); end if;
end $$;

create or replace function public.challenge_leaderboard(cid uuid)
returns table(user_id uuid, full_name text, score integer)
language sql stable security definer set search_path = public as $$
  select p.user_id, pr.full_name, metric_score(p.user_id, c.metric, c.starts_at, c.ends_at) as score
  from challenge_participants p
  join challenges c on c.id = p.challenge_id
  join profiles pr on pr.id = p.user_id
  where p.challenge_id = cid
  order by score desc, pr.full_name;
$$;

create or replace function public.duel_scores(did uuid)
returns table(challenger_score integer, opponent_score integer)
language sql stable security definer set search_path = public as $$
  select metric_score(d.challenger_id, d.metric, d.starts_at, d.ends_at),
         metric_score(d.opponent_id, d.metric, d.starts_at, d.ends_at)
  from duels d where d.id = did;
$$;

create or replace function public.settle_duel(did uuid)
returns void language plpgsql security definer set search_path = public as $$
declare d record; cs int; os int; w uuid;
begin
  select * into d from duels where id = did;
  if d is null or d.status <> 'active' then return; end if;
  if now() < d.ends_at then return; end if;
  if auth.uid() <> d.challenger_id and auth.uid() <> d.opponent_id then return; end if;
  cs := metric_score(d.challenger_id, d.metric, d.starts_at, d.ends_at);
  os := metric_score(d.opponent_id, d.metric, d.starts_at, d.ends_at);
  if cs > os then w := d.challenger_id; elsif os > cs then w := d.opponent_id; else w := null; end if;
  update duels set status = 'completed', winner_id = w where id = did;
  if w is not null then
    perform award_points(w, 50, 'duel_win', 'duel', did);
    perform add_activity(w, 'duel', 'Won a duel! 🏆', null, 'friends');
    perform check_badges(w);
  end if;
end $$;

create or replace function public.partner_goal_progress(gid uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(metric_score(m.user_id, g.metric, g.starts_at, g.ends_at)),0)::int
  from partner_goal_members m join partner_goals g on g.id = m.goal_id where m.goal_id = gid;
$$;

-- Reward completing a session (also keeps the existing credit deduction).
create or replace function public.on_session_completed()
returns trigger language plpgsql security definer set search_path = public as $$
declare pkg uuid;
begin
  if new.status = 'completed' and coalesce(old.status::text,'') <> 'completed' and new.client_id is not null then
    select id into pkg from client_packages where client_id = new.client_id and status='active' and sessions_used < sessions_total order by purchased_at asc limit 1;
    if pkg is not null then update client_packages set sessions_used = sessions_used + 1 where id = pkg; end if;
    perform award_points(new.client_id, 25, 'session', 'session', new.id);
    perform add_activity(new.client_id, 'session', 'Completed a training session 💪', null, 'friends');
    perform check_badges(new.client_id);
  end if;
  return new;
end $$;

create or replace function public.on_workout_logged()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.client_id, 10, 'workout', 'workout_log', new.id);
  perform check_badges(new.client_id);
  return new;
end $$;
drop trigger if exists trg_workout_logged on public.workout_logs;
create trigger trg_workout_logged after insert on public.workout_logs
  for each row execute function public.on_workout_logged();

-- Lock down internal functions from direct API access.
revoke execute on function public.metric_score(uuid, challenge_metric, timestamptz, timestamptz) from anon, authenticated, public;
revoke execute on function public.award_points(uuid, integer, text, text, uuid) from anon, authenticated, public;
revoke execute on function public.add_activity(uuid, text, text, text, text) from anon, authenticated, public;
revoke execute on function public.check_badges(uuid) from anon, authenticated, public;
revoke execute on function public.on_workout_logged() from anon, authenticated, public;
-- These are called by the app via RPC (authenticated), block anon only.
revoke execute on function public.do_checkin() from anon;
revoke execute on function public.give_kudos(uuid) from anon;
revoke execute on function public.settle_duel(uuid) from anon;
revoke execute on function public.challenge_leaderboard(uuid) from anon;
revoke execute on function public.duel_scores(uuid) from anon;
revoke execute on function public.partner_goal_progress(uuid) from anon;
