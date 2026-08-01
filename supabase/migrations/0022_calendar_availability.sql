-- Anonymized busy blocks: lets a client see WHEN a coach is booked (not by whom),
-- so those times render as shaded/locked boxes on the calendar. Excludes the
-- caller's own sessions (those still render with full detail via normal RLS).
create or replace function public.trainer_busy_blocks(p_trainer uuid, p_from timestamptz, p_to timestamptz)
returns table(starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select starts_at, ends_at from sessions
  where trainer_id = p_trainer and status = 'scheduled'
    and starts_at < p_to and ends_at > p_from
    and client_id is distinct from auth.uid();
$$;
grant execute on function public.trainer_busy_blocks(uuid, timestamptz, timestamptz) to authenticated;

-- Robust double-booking guard that sees ALL of a trainer's sessions (bypasses
-- the requester's row visibility), used at booking time.
create or replace function public.trainer_has_conflict(p_trainer uuid, p_start timestamptz, p_end timestamptz)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sessions
    where trainer_id = p_trainer and status = 'scheduled'
      and starts_at < p_end and ends_at > p_start
  );
$$;
grant execute on function public.trainer_has_conflict(uuid, timestamptz, timestamptz) to authenticated;
