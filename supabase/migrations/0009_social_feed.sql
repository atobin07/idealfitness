-- Facebook-style member feed: posts (with photos), likes, comments, tagging,
-- and shoutout / congrats / thank-you post types.

create type post_kind as enum ('post', 'shoutout', 'congrats', 'thank_you', 'milestone');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind post_kind not null default 'post',
  body text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (coalesce(length(trim(body)), 0) > 0 or image_url is not null)
);
create index posts_created_idx on public.posts (created_at desc);

create table public.post_tags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  tagged_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, tagged_user_id)
);
create index post_tags_user_idx on public.post_tags (tagged_user_id);

create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

create table public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

-- ---------------------------------------------------------------------------
-- RLS — the feed is gym-wide: everyone reads, everyone posts as themselves.
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.comment_likes enable row level security;

create policy "posts readable" on public.posts for select to authenticated using (true);
create policy "author posts" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "edit own posts" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "delete own posts" on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "tags readable" on public.post_tags for select to authenticated using (true);
create policy "tag on own posts" on public.post_tags for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "untag on own posts" on public.post_tags for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "likes readable" on public.post_likes for select to authenticated using (true);
create policy "like posts" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "unlike posts" on public.post_likes for delete to authenticated using (user_id = auth.uid());

create policy "comments readable" on public.post_comments for select to authenticated using (true);
create policy "write comments" on public.post_comments for insert to authenticated with check (author_id = auth.uid());
create policy "edit own comments" on public.post_comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "delete own comments" on public.post_comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "comment likes readable" on public.comment_likes for select to authenticated using (true);
create policy "like comments" on public.comment_likes for insert to authenticated with check (user_id = auth.uid());
create policy "unlike comments" on public.comment_likes for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Engagement hooks: points + notifications.
-- ---------------------------------------------------------------------------
create or replace function public.on_post_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.author_id, 5, 'post', 'post', new.id);
  perform check_badges(new.author_id);
  return new;
end $$;
drop trigger if exists trg_post_created on public.posts;
create trigger trg_post_created after insert on public.posts
  for each row execute function public.on_post_created();

create or replace function public.on_post_tag()
returns trigger language plpgsql security definer set search_path = public as $$
declare k post_kind; author uuid; who text; verb text;
begin
  select kind, author_id into k, author from posts where id = new.post_id;
  if new.tagged_user_id = author then return new; end if;
  select full_name into who from profiles where id = author;
  verb := case k
    when 'shoutout' then 'gave you a shoutout'
    when 'congrats' then 'congratulated you'
    when 'thank_you' then 'thanked you'
    else 'tagged you in a post' end;
  if k in ('shoutout', 'congrats', 'thank_you') then
    perform award_points(new.tagged_user_id, 5, 'recognition', 'post', new.post_id);
  end if;
  insert into notifications (user_id, type, title, body, link)
  values (new.tagged_user_id, 'social', coalesce(who, 'A member') || ' ' || verb, null, '/community');
  return new;
end $$;
drop trigger if exists trg_post_tag on public.post_tags;
create trigger trg_post_tag after insert on public.post_tags
  for each row execute function public.on_post_tag();

create or replace function public.on_post_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid; who text;
begin
  select author_id into author from posts where id = new.post_id;
  if author is null or author = new.author_id then return new; end if;
  select full_name into who from profiles where id = new.author_id;
  insert into notifications (user_id, type, title, body, link)
  values (author, 'social', coalesce(who, 'A member') || ' commented on your post', left(new.body, 120), '/community');
  return new;
end $$;
drop trigger if exists trg_post_comment on public.post_comments;
create trigger trg_post_comment after insert on public.post_comments
  for each row execute function public.on_post_comment();

-- ---------------------------------------------------------------------------
-- Storage bucket for member photos.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true)
on conflict (id) do nothing;

drop policy if exists "post media public read" on storage.objects;
create policy "post media public read" on storage.objects for select using (bucket_id = 'post-media');

drop policy if exists "post media upload own" on storage.objects;
create policy "post media upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "post media delete own" on storage.objects;
create policy "post media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'post-media' and owner = auth.uid());
