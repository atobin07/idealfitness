-- Gym "hot topic" discussions (admin-run, archived with a conclusion) and a
-- feedback channel to trainers / the owner / staff, with an anonymous option.

-- ---------------------------------------------------------------------------
-- Discussions
-- ---------------------------------------------------------------------------
create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  details text,
  status text not null default 'active' check (status in ('active', 'archived')),
  conclusion text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index discussions_status_idx on public.discussions (status, created_at desc);

create table public.discussion_responses (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index discussion_responses_idx on public.discussion_responses (discussion_id, created_at);

create table public.discussion_response_likes (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.discussion_responses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (response_id, user_id)
);

alter table public.discussions enable row level security;
alter table public.discussion_responses enable row level security;
alter table public.discussion_response_likes enable row level security;

create policy "discussions readable" on public.discussions for select to authenticated using (true);
create policy "admins manage discussions" on public.discussions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "responses readable" on public.discussion_responses for select to authenticated using (true);
create policy "write responses" on public.discussion_responses for insert to authenticated with check (user_id = auth.uid());
create policy "delete own responses" on public.discussion_responses for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "response likes readable" on public.discussion_response_likes for select to authenticated using (true);
create policy "like responses" on public.discussion_response_likes for insert to authenticated with check (user_id = auth.uid());
create policy "unlike responses" on public.discussion_response_likes for delete to authenticated using (user_id = auth.uid());

-- A couple of points for weighing in.
create or replace function public.on_discussion_response()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.user_id, 2, 'discussion', 'discussion_response', new.id);
  return new;
end $$;
drop trigger if exists trg_discussion_response on public.discussion_responses;
create trigger trg_discussion_response after insert on public.discussion_responses
  for each row execute function public.on_discussion_response();

-- ---------------------------------------------------------------------------
-- Feedback
-- ---------------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles(id) on delete set null,
  is_anonymous boolean not null default false,
  audience text not null check (audience in ('owner', 'trainer', 'staff')),
  trainer_id uuid references public.profiles(id) on delete set null,
  category text,
  body text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);
create index feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- Anyone can send; anonymous rows carry no sender.
create policy "send feedback" on public.feedback for insert to authenticated
  with check (
    (is_anonymous and from_user_id is null)
    or (not is_anonymous and from_user_id = auth.uid())
  );

-- Recipients (and the sender, if not anonymous) can read.
create policy "read feedback" on public.feedback for select to authenticated
  using (
    public.is_admin()
    or (audience = 'trainer' and trainer_id = auth.uid())
    or (audience = 'staff' and public.current_user_role() = 'trainer')
    or (not is_anonymous and from_user_id = auth.uid())
  );

-- Recipients can update the status (triage).
create policy "triage feedback" on public.feedback for update to authenticated
  using (
    public.is_admin()
    or (audience = 'trainer' and trainer_id = auth.uid())
    or (audience = 'staff' and public.current_user_role() = 'trainer')
  )
  with check (
    public.is_admin()
    or (audience = 'trainer' and trainer_id = auth.uid())
    or (audience = 'staff' and public.current_user_role() = 'trainer')
  );

-- Seed a first discussion so the page isn't empty.
insert into public.discussions (prompt, details, created_by)
select 'What''s the best season to train in? 🌤️', 'Summer heat, crisp fall mornings, cozy winter grind, or spring energy? Make your case!', p.id
from public.profiles p where p.role = 'trainer' order by p.created_at limit 1;
