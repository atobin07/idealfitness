import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { logBenchmark, deleteBenchmark } from "@/app/(app)/progress/actions";
import {
  BENCHMARKS,
  BENCHMARK_CATEGORIES,
  bestValue,
  formatBenchmarkValue,
  type Benchmark,
} from "@/lib/benchmarks";
import type { BenchmarkRecord, Profile } from "@/lib/database.types";

type Entry = Pick<BenchmarkRecord, "id" | "value" | "achieved_on">;

export async function BenchmarksSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("benchmark_records")
    .select("id, key, value, achieved_on")
    .eq("user_id", profile.id)
    .order("achieved_on", { ascending: false });

  const records = (data ?? []) as (Entry & { key: string })[];
  const byKey = new Map<string, Entry[]>();
  for (const r of records) {
    const list = byKey.get(r.key) ?? [];
    list.push({ id: r.id, value: r.value, achieved_on: r.achieved_on });
    byKey.set(r.key, list);
  }

  const today = new Date().toISOString().slice(0, 10);
  const loggedCount = BENCHMARKS.filter((b) => (byKey.get(b.key)?.length ?? 0) > 0).length;

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Benchmarks &amp; PRs</h2>
        <p className="text-sm muted">{loggedCount} of {BENCHMARKS.length} benchmarks logged</p>
      </div>

      <div className="space-y-6">
        {BENCHMARK_CATEGORIES.map((category) => {
          const items = BENCHMARKS.filter((b) => b.category === category);
          return (
            <div key={category}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide muted">{category}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((b) => (
                  <BenchmarkCard key={b.key} bench={b} entries={byKey.get(b.key) ?? []} today={today} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BenchmarkCard({ bench, entries, today }: { bench: Benchmark; entries: Entry[]; today: string }) {
  const pr = bestValue(bench, entries.map((e) => e.value));
  const prEntry = pr == null ? null : entries.find((e) => e.value === pr) ?? null;
  const recent = [...entries].slice(0, 3);

  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 dark:text-white">{bench.label}</p>
          {bench.hint && <p className="text-xs muted">{bench.hint}</p>}
        </div>
        {pr != null ? (
          <div className="text-right">
            <p className="text-lg font-extrabold leading-none text-brand-600 dark:text-brand-300">{formatBenchmarkValue(bench, pr)}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">PR</p>
          </div>
        ) : (
          <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
        )}
      </div>

      {prEntry && (
        <p className="mt-1 text-xs muted">Best on {format(new Date(prEntry.achieved_on + "T00:00:00"), "MMM d, yyyy")}</p>
      )}

      {/* Log a new attempt */}
      <form action={logBenchmark} className="mt-3 flex items-center gap-1.5">
        <input type="hidden" name="key" value={bench.key} />
        <input type="hidden" name="achieved_on" value={today} />
        <input
          name="value"
          required
          {...(bench.kind === "time"
            ? { type: "text", inputMode: "numeric" as const, placeholder: bench.placeholder }
            : { type: "number", step: "any", min: "0", placeholder: bench.placeholder })}
          className="input h-9 w-full py-1"
          aria-label={`Log ${bench.label}`}
        />
        <button className="btn-secondary shrink-0 px-3 py-1.5 text-xs">Log</button>
      </form>

      {/* Recent attempts */}
      {recent.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 dark:border-white/10">
          {recent.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs">
              <span className="muted">{format(new Date(e.achieved_on + "T00:00:00"), "MMM d")}</span>
              <span className="font-medium text-ink-900 dark:text-white">{formatBenchmarkValue(bench, e.value)}</span>
              <form action={deleteBenchmark}>
                <input type="hidden" name="id" value={e.id} />
                <button className="text-slate-300 hover:text-red-500" title="Delete" aria-label="Delete entry">✕</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
