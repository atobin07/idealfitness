-- Extends the existing recurring group-class pattern (weekdays: 6:15am, 9am,
-- 5:30pm, no 5:30pm Friday — same convention as the classes already seeded
-- for early August) forward from today for the next 12 weeks.
do $$
declare
  tz text;
  trainer uuid := 'afd3cb82-cf89-495a-bac3-327ac2e40599'; -- Alex Rivera (owns the existing recurring classes)
  d date;
  dow int;
  slot record;
  sdt timestamptz;
  edt timestamptz;
begin
  select timezone into tz from public.gym_settings where id = true;
  tz := coalesce(tz, 'America/New_York');

  for i in 0..83 loop
    d := current_date + i;
    dow := extract(dow from d)::int;
    if dow = 0 or dow = 6 then continue; end if; -- weekdays only

    for slot in
      select * from (values
        ('06:15'::time, '6:15 AM Class', 60, true),
        ('09:00'::time, '9:00 AM Class', 60, true),
        ('17:30'::time, '5:30 PM Class', 60, false) -- all_week=false -> skip Friday
      ) as t(st, title, dur, all_week)
    loop
      if dow = 5 and not slot.all_week then continue; end if;
      sdt := (d + slot.st) at time zone tz;
      edt := sdt + make_interval(mins => slot.dur);
      if sdt > now() and not exists (
        select 1 from public.classes where trainer_id = trainer and starts_at = sdt
      ) then
        insert into public.classes (trainer_id, title, starts_at, ends_at, capacity, location)
        values (trainer, slot.title, sdt, edt, 12, null);
      end if;
    end loop;
  end loop;
end $$;
