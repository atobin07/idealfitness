-- Support tickets: members file issues via a guided helper; owners are notified.
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  subject text not null,
  summary text not null,
  details text,
  urgency text not null default 'medium' check (urgency in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);
create index support_tickets_created_idx on public.support_tickets (created_at desc);

alter table public.support_tickets enable row level security;

create policy "own or admin read tickets" on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "open own ticket" on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid());
create policy "admins triage tickets" on public.support_tickets for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.on_support_ticket()
returns trigger language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select full_name into who from profiles where id = new.user_id;
  insert into notifications (user_id, type, title, body, link)
  select p.id, 'support',
    '🎫 New support ticket: ' || new.subject,
    coalesce(who, 'A member') || ' · ' || new.summary,
    '/support'
  from profiles p where p.is_admin;
  return new;
end $$;
drop trigger if exists trg_support_ticket on public.support_tickets;
create trigger trg_support_ticket after insert on public.support_tickets
  for each row execute function public.on_support_ticket();
