-- Web Push notifications: a subscription per device/browser, plus a trigger
-- that fires the `send-push` Edge Function after every insert into
-- `notifications` (regardless of which existing trigger created the row).
--
-- Secrets this depends on (not managed here — see README/deploy notes):
--   - Vault secret "push_trigger_secret": shared secret the trigger sends to
--     the Edge Function so it can trust the call (no end-user JWT to check).
--   - Edge Function secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
--     VAPID_SUBJECT, PUSH_TRIGGER_SECRET (matching the Vault secret above).

create extension if not exists pg_net with schema extensions;

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "manage own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.notify_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'push_trigger_secret';
  if secret is null then
    return new; -- not configured yet, skip silently
  end if;

  perform net.http_post(
    url := 'https://oknfnlucnnnzgxahtkrp.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-trigger-secret', secret),
    body := jsonb_build_object(
      'user_id', new.user_id,
      'title', new.title,
      'body', new.body,
      'link', new.link
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_push on public.notifications;
create trigger trg_notify_push
  after insert on public.notifications
  for each row execute function public.notify_push();
