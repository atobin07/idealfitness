-- A short "what I'm working on right now" goal members can show on their profile.
alter table public.member_profiles add column if not exists current_goal text;
