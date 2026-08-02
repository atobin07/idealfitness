-- Private, trainer-only notes & flags on each client. Stored in a dedicated
-- table (NOT trainer_clients, whose SELECT policy exposes the row to the client)
-- so the client can never read what their trainer writes.
create table if not exists public.client_notes (
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  notes text,
  tags text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (trainer_id, client_id)
);
alter table public.client_notes enable row level security;
create policy "trainer manages own client notes" on public.client_notes
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
grant select, insert, update, delete on public.client_notes to authenticated;
