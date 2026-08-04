-- Personal benchmark PRs: members log their best on standard gym benchmarks
-- (the powerlifts, row splits, jump rope, mile time, etc). Each row is one
-- logged attempt; the "PR" is the best value per benchmark key.
create table if not exists public.benchmark_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null,
  value numeric not null,
  achieved_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists benchmark_records_user_idx on public.benchmark_records (user_id, key, achieved_on desc);

alter table public.benchmark_records enable row level security;
-- Private to the member who logged them.
create policy "own benchmarks readable" on public.benchmark_records for select to authenticated using (user_id = auth.uid());
create policy "log own benchmark" on public.benchmark_records for insert to authenticated with check (user_id = auth.uid());
create policy "edit own benchmark" on public.benchmark_records for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own benchmark" on public.benchmark_records for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.benchmark_records to authenticated;
