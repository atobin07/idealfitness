-- Class schedule rules + trainer availability seeding for the calendar sync.
--
-- Group class schedule:
--   Mon–Thu: 6:15 AM, 9:00 AM, 5:30 PM
--   Fri:     6:15 AM, 9:00 AM        (no 5:30 PM class)
--   Sat/Sun: none

create or replace function public.generate_class_schedule(p_days integer default 14)
returns integer language plpgsql security definer set search_path = public as $$
declare
  tz text; d date; dow int; slot record; cnt int := 0; sdt timestamptz; edt timestamptz; caller uuid;
begin
  caller := auth.uid();
  if not exists (select 1 from public.profiles where id = caller and (role = 'trainer' or is_admin)) then
    raise exception 'Only coaches or admins can generate the class schedule';
  end if;
  select timezone into tz from public.gym_settings where id = true;
  tz := coalesce(tz, 'America/New_York');
  for i in 0..greatest(0, p_days - 1) loop
    d := current_date + i;
    dow := extract(dow from d)::int;          -- 0=Sun … 6=Sat
    if dow = 0 or dow = 6 then continue; end if;  -- no weekend classes
    for slot in
      select * from (values
        ('06:15'::time, '6:15 AM Class', 60, true),
        ('09:00'::time, '9:00 AM Class', 60, true),
        ('17:30'::time, '5:30 PM Class', 60, false)  -- all_week=false → weekdays except Friday
      ) as t(st, title, dur, all_week)
    loop
      if dow = 5 and not slot.all_week then continue; end if;  -- no Friday 5:30 PM
      sdt := (d + slot.st) at time zone tz;
      edt := sdt + make_interval(mins => slot.dur);
      if sdt > now() and not exists (
        select 1 from public.classes where trainer_id = caller and starts_at = sdt
      ) then
        insert into public.classes (trainer_id, title, starts_at, ends_at, capacity, location)
        values (caller, slot.title, sdt, edt, 12, 'Main floor');
        cnt := cnt + 1;
      end if;
    end loop;
  end loop;
  return cnt;
end $$;

-- Remove any already-generated classes that violate the new rules
-- (Friday 5:30 PM, or any weekend auto-generated class).
delete from public.classes
where starts_at > now()
  and title in ('6:15 AM Class', '9:00 AM Class', '5:30 PM Class')
  and (
    extract(dow from (starts_at at time zone 'America/New_York')) in (0, 6)
    or (extract(dow from (starts_at at time zone 'America/New_York')) = 5
        and (starts_at at time zone 'America/New_York')::time = '17:30')
  );

-- Seed a sensible default weekly availability for coaches who have none,
-- so the calendar has real windows to sync against (Mon–Fri, 6 AM – 7 PM).
insert into public.availability (trainer_id, weekday, start_time, end_time)
select p.id, wd, '06:00'::time, '19:00'::time
from public.profiles p
cross join generate_series(1, 5) as wd
where p.role = 'trainer'
  and not exists (select 1 from public.availability a where a.trainer_id = p.id)
on conflict do nothing;
