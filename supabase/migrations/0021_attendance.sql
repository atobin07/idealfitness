-- Trainer-recorded attendance: check-ins, no-shows, cancellations. A "present"
-- mark also credits the member's account (check-in, streak, points, badges) so
-- members who don't use the app still get their data captured for them.
create type attendance_status as enum ('present', 'no_show', 'cancelled', 'late_cancel', 'excused');

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  recorded_by uuid references public.profiles(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  attended_on date not null default current_date,
  status attendance_status not null default 'present',
  note text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (member_id, class_id, attended_on)
);
create index attendance_member_idx on public.attendance (member_id, attended_on desc);
create index attendance_date_idx on public.attendance (attended_on desc);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and (role = 'trainer' or is_admin));
$$;

alter table public.attendance enable row level security;
create policy "read own or staff attendance" on public.attendance for select to authenticated
  using (member_id = auth.uid() or public.is_staff());
create policy "staff record attendance" on public.attendance for insert to authenticated
  with check (public.is_staff());
create policy "staff update attendance" on public.attendance for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "staff delete attendance" on public.attendance for delete to authenticated
  using (public.is_staff());

create or replace function public.record_attendance(
  p_member uuid,
  p_status attendance_status,
  p_class uuid default null,
  p_date date default current_date,
  p_note text default null
) returns json language plpgsql security definer set search_path = public as $$
declare last date; streak int; bonus int := 0; awarded int := 0; did_checkin boolean := false;
begin
  if not public.is_staff() then raise exception 'not authorized'; end if;

  insert into attendance (member_id, recorded_by, class_id, attended_on, status, note)
  values (p_member, auth.uid(), p_class, p_date, p_status, nullif(p_note, ''))
  on conflict (member_id, class_id, attended_on) do update
    set status = excluded.status, note = excluded.note, recorded_by = excluded.recorded_by, created_at = now();

  if p_status = 'present' and not exists (select 1 from checkins where user_id = p_member and checkin_date = p_date) then
    insert into checkins (user_id, checkin_date) values (p_member, p_date);
    insert into member_stats (user_id) values (p_member) on conflict (user_id) do nothing;
    select last_checkin_date, current_streak into last, streak from member_stats where user_id = p_member;
    if last = p_date - 1 then streak := coalesce(streak, 0) + 1; else streak := 1; end if;
    update member_stats set last_checkin_date = p_date, current_streak = streak,
      longest_streak = greatest(longest_streak, streak), checkins_count = checkins_count + 1, updated_at = now()
      where user_id = p_member;
    if streak = 30 then bonus := 50; elsif streak > 0 and streak % 7 = 0 then bonus := 15; end if;
    perform award_points(p_member, 10 + bonus, 'checkin', 'checkin', null);
    perform check_badges(p_member);
    awarded := 10 + bonus; did_checkin := true;
  end if;

  return json_build_object('status', p_status, 'checked_in', did_checkin, 'points', awarded);
end $$;

grant execute on function public.record_attendance(uuid, attendance_status, uuid, date, text) to authenticated;
