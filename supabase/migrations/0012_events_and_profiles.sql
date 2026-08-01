-- Events (gym + non-gym) with RSVP / Maybe / Can't-make-it responses,
-- and rich get-to-know-you member profiles.

create type event_kind as enum ('gym', 'social');
create type rsvp_status as enum ('going', 'maybe', 'cant');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  kind event_kind not null default 'gym',
  title text not null,
  description text,
  location text,
  image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_starts_idx on public.events (starts_at);

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status rsvp_status not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index event_rsvps_event_idx on public.event_rsvps (event_id);

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

create policy "events readable" on public.events for select to authenticated using (true);
create policy "create events" on public.events for insert to authenticated with check (created_by = auth.uid());
create policy "edit own events" on public.events for update to authenticated using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
create policy "delete own events" on public.events for delete to authenticated using (created_by = auth.uid() or public.is_admin());

create policy "rsvps readable" on public.event_rsvps for select to authenticated using (true);
create policy "rsvp self" on public.event_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy "update own rsvp" on public.event_rsvps for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "remove own rsvp" on public.event_rsvps for delete to authenticated using (user_id = auth.uid());

-- Reward posting an event + drop it into the activity feed.
create or replace function public.on_event_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.created_by, 5, 'event', 'event', new.id);
  perform add_activity(new.created_by, 'event', 'Posted an event: ' || new.title, null, 'public');
  return new;
end $$;
drop trigger if exists trg_event_created on public.events;
create trigger trg_event_created after insert on public.events
  for each row execute function public.on_event_created();

-- ---------------------------------------------------------------------------
-- Rich member profiles.
-- ---------------------------------------------------------------------------
create table public.member_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  intro text,
  hometown text,
  occupation text,
  favorite_color text,
  favorite_food text,
  favorite_music text,
  favorite_decade text,
  favorite_movie text,
  hobbies text,
  dream_vacation text,
  pets text,
  early_bird_or_night_owl text,
  coffee_or_tea text,
  fun_fact text,
  favorite_workout_song text,
  favorite_movement text,
  favorite_training_day text,
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;
create policy "profiles readable" on public.member_profiles for select to authenticated using (true);
create policy "edit own member profile" on public.member_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "update own member profile" on public.member_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Avatar storage.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "avatars upload own" on storage.objects;
create policy "avatars upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());
