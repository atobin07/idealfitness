-- State-of-the-art DMs: attachments (image/file/gif), per-message font, reactions.
alter table public.messages add column if not exists attachment_url text;
alter table public.messages add column if not exists attachment_type text; -- image | file | gif
alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists font text not null default 'default';
alter table public.messages alter column body drop not null;

create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);
create index if not exists message_reactions_msg_idx on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;

create policy "read reactions in my threads" on public.message_reactions for select to authenticated
  using (exists (select 1 from public.messages m where m.id = message_id and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())));
create policy "react in my threads" on public.message_reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.messages m where m.id = message_id and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())));
create policy "remove own reactions" on public.message_reactions for delete to authenticated using (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('message-media', 'message-media', true)
on conflict (id) do nothing;

drop policy if exists "message media read" on storage.objects;
create policy "message media read" on storage.objects for select using (bucket_id = 'message-media');
drop policy if exists "message media upload own" on storage.objects;
create policy "message media upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'message-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "message media delete own" on storage.objects;
create policy "message media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'message-media' and owner = auth.uid());
