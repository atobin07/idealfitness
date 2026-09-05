-- Group classes currently don't block personal-training (1:1 session) booking
-- for the same trainer — trainer_has_conflict/trainer_busy_blocks only look at
-- `sessions`. Extend both to also treat the trainer's `classes` as busy time.

create or replace function public.trainer_has_conflict(p_trainer uuid, p_start timestamptz, p_end timestamptz)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from sessions
    where trainer_id = p_trainer and status = 'scheduled'
      and starts_at < p_end and ends_at > p_start
  )
  or exists (
    select 1 from classes
    where trainer_id = p_trainer
      and starts_at < p_end and ends_at > p_start
  );
$$;
grant execute on function public.trainer_has_conflict(uuid, timestamptz, timestamptz) to authenticated;

create or replace function public.trainer_busy_blocks(p_trainer uuid, p_from timestamptz, p_to timestamptz)
returns table(starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select starts_at, ends_at from sessions
  where trainer_id = p_trainer and status = 'scheduled'
    and starts_at < p_to and ends_at > p_from
    and client_id is distinct from auth.uid()
  union all
  select starts_at, ends_at from classes
  where trainer_id = p_trainer
    and starts_at < p_to and ends_at > p_from;
$$;
grant execute on function public.trainer_busy_blocks(uuid, timestamptz, timestamptz) to authenticated;
