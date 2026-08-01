-- Demo posts so the member feed is alive on first load.
do $$
declare alex uuid; amy uuid; ben uuid; p1 uuid; p2 uuid; p3 uuid;
begin
  select id into alex from profiles where role='trainer' order by created_at limit 1;
  select id into amy from profiles where full_name='Amy Chen' limit 1;
  select id into ben from profiles where full_name='Ben Okafor' limit 1;
  if amy is null or ben is null then return; end if;

  if not exists (select 1 from posts) then
    insert into posts (author_id, kind, body, created_at) values
      (amy, 'post', 'Hit a new deadlift PR this morning — 205lbs! Feeling unstoppable 💪 Who''s in for the 6:15 class tomorrow?', now() - interval '5 hours')
      returning id into p1;
    insert into posts (author_id, kind, body, created_at) values
      (ben, 'shoutout', 'Massive shoutout for pushing me through that last set. Couldn''t have done it without you!', now() - interval '3 hours')
      returning id into p2;
    insert into posts (author_id, kind, body, created_at) values
      (coalesce(alex, amy), 'congrats', 'Congrats on your 8-day check-in streak! The consistency is paying off. Keep showing up 🔥', now() - interval '1 hour')
      returning id into p3;

    insert into post_tags (post_id, tagged_user_id) values (p2, amy);
    insert into post_tags (post_id, tagged_user_id) values (p3, amy);

    insert into post_likes (post_id, user_id) values (p1, ben), (p1, coalesce(alex, ben)) on conflict do nothing;
    insert into post_likes (post_id, user_id) values (p2, amy) on conflict do nothing;
    insert into post_likes (post_id, user_id) values (p3, amy), (p3, ben) on conflict do nothing;

    insert into post_comments (post_id, author_id, body, created_at) values
      (p1, ben, 'Beast mode! I''ll be there 🙌', now() - interval '4 hours'),
      (p1, coalesce(alex, ben), 'Huge progress Amy — proud of you!', now() - interval '3 hours 30 minutes'),
      (p2, amy, 'Anytime! We push each other 💯', now() - interval '2 hours');
  end if;
end $$;
