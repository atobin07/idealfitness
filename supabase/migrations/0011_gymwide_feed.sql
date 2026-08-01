-- Small, tight-knit gym: everyone is part of one community. Drop the
-- friends-based visibility gate so the whole gym sees the shared activity feed.
drop policy if exists "see feed" on public.activity_events;
create policy "see feed" on public.activity_events for select to authenticated using (true);

-- New activity defaults to gym-wide visibility.
alter table public.activity_events alter column visibility set default 'public';
