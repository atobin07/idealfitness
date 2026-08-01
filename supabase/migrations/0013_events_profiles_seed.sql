-- Demo events + a couple of filled-out member profiles so the new
-- Events and Members pages have life on first load. Idempotent.
do $$
declare alex uuid; amy uuid; ben uuid; ao uuid; e1 uuid; e2 uuid;
begin
  select id into alex from profiles where role='trainer' order by created_at limit 1;
  select id into amy from profiles where full_name='Amy Chen' limit 1;
  select id into ben from profiles where full_name='Ben Okafor' limit 1;
  select id into ao from profiles where email='atobin07@proton.me' limit 1;

  if not exists (select 1 from events where title='Saturday Partner WOD') then
    insert into events (created_by, kind, title, description, location, starts_at, ends_at)
    values (coalesce(alex, amy), 'gym', 'Saturday Partner WOD',
      'Grab a partner for a fun team workout followed by coffee. All levels welcome!',
      'iDEAL Fitness — Main floor',
      (current_date + 3) + time '09:00', (current_date + 3) + time '10:30')
    returning id into e1;
    if amy is not null then insert into event_rsvps (event_id, user_id, status) values (e1, amy, 'going'); end if;
    if ben is not null then insert into event_rsvps (event_id, user_id, status, note) values (e1, ben, 'cant', 'Out of town for my daughter''s soccer tournament — have fun!'); end if;
    if ao is not null then insert into event_rsvps (event_id, user_id, status) values (e1, ao, 'maybe'); end if;
  end if;

  if not exists (select 1 from events where title='Members Beach Bonfire') then
    insert into events (created_by, kind, title, description, location, starts_at, ends_at)
    values (coalesce(amy, alex), 'social', 'Members Beach Bonfire',
      'Non-gym hang! Bring your family, a chair, and a snack to share. Let''s connect outside the gym. 🔥',
      'Chesapeake Beach (near the pier)',
      (current_date + 7) + time '18:30', (current_date + 7) + time '21:00')
    returning id into e2;
    if amy is not null then insert into event_rsvps (event_id, user_id, status) values (e2, amy, 'going'); end if;
    if ben is not null then insert into event_rsvps (event_id, user_id, status) values (e2, ben, 'going'); end if;
  end if;

  if amy is not null then
    insert into member_profiles (user_id, intro, hometown, occupation, favorite_color, favorite_food,
      favorite_music, favorite_decade, favorite_movie, hobbies, dream_vacation, pets,
      early_bird_or_night_owl, coffee_or_tea, fun_fact,
      favorite_workout_song, favorite_movement, favorite_training_day)
    values (amy,
      'Joined iDEAL in 2019 and never looked back. Love the people here as much as the workouts. Always down for a challenge!',
      'Virginia Beach, VA', 'Elementary school teacher', 'Sky blue', 'Tacos (Taco Tuesday is sacred)',
      '90s hip-hop & Beyoncé', '90s', 'Rocky IV', 'Paddleboarding, baking, true-crime podcasts',
      'Amalfi Coast, Italy', 'A golden retriever named Duke',
      'Early bird', 'Coffee', 'I can solve a Rubik''s cube in under a minute',
      'Till I Collapse — Eminem', 'Deadlift', 'Saturday')
    on conflict (user_id) do nothing;
  end if;

  if ben is not null then
    insert into member_profiles (user_id, intro, hometown, occupation, favorite_food, favorite_movement, favorite_training_day, coffee_or_tea)
    values (ben, 'Here to get strong and have fun doing it. Partner workouts are my favorite.',
      'Norfolk, VA', 'Software engineer', 'BBQ ribs', 'Back squat', 'Monday', 'Coffee')
    on conflict (user_id) do nothing;
  end if;
end $$;
