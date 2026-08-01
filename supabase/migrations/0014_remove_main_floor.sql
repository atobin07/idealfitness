-- Only one floor at the gym — stop stamping classes with a "Main floor" location.
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
    dow := extract(dow from d)::int;
    if dow = 0 or dow = 6 then continue; end if;
    for slot in
      select * from (values
        ('06:15'::time, '6:15 AM Class', 60, true),
        ('09:00'::time, '9:00 AM Class', 60, true),
        ('17:30'::time, '5:30 PM Class', 60, false)
      ) as t(st, title, dur, all_week)
    loop
      if dow = 5 and not slot.all_week then continue; end if;
      sdt := (d + slot.st) at time zone tz;
      edt := sdt + make_interval(mins => slot.dur);
      if sdt > now() and not exists (
        select 1 from public.classes where trainer_id = caller and starts_at = sdt
      ) then
        insert into public.classes (trainer_id, title, starts_at, ends_at, capacity, location)
        values (caller, slot.title, sdt, edt, 12, null);
        cnt := cnt + 1;
      end if;
    end loop;
  end loop;
  return cnt;
end $$;

update public.classes set location = null where location = 'Main floor';
update public.events set location = 'iDEAL Fitness' where location = 'iDEAL Fitness — Main floor';
