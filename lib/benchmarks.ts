// The gym's standard benchmarks. Each member logs attempts; their PR is the
// best value per key. Values are stored numerically — time as seconds.

export type BenchKind = "weight" | "time" | "reps" | "distance";

export type Benchmark = {
  key: string;
  label: string;
  category: string;
  kind: BenchKind;
  higherBetter: boolean;
  unit: string;
  placeholder: string;
  hint?: string;
};

export const BENCHMARK_CATEGORIES = ["Powerlifts & Strength", "Conditioning", "Bodyweight & Skill"] as const;

export const BENCHMARKS: Benchmark[] = [
  // ---- Powerlifts & Strength (heaviest lift wins) ----
  { key: "back_squat", label: "Back Squat", category: "Powerlifts & Strength", kind: "weight", higherBetter: true, unit: "lb", placeholder: "225", hint: "1-rep max" },
  { key: "bench_press", label: "Bench Press", category: "Powerlifts & Strength", kind: "weight", higherBetter: true, unit: "lb", placeholder: "185", hint: "1-rep max" },
  { key: "deadlift", label: "Deadlift", category: "Powerlifts & Strength", kind: "weight", higherBetter: true, unit: "lb", placeholder: "315", hint: "1-rep max" },
  { key: "overhead_press", label: "Overhead Press", category: "Powerlifts & Strength", kind: "weight", higherBetter: true, unit: "lb", placeholder: "115", hint: "1-rep max" },
  { key: "front_squat", label: "Front Squat", category: "Powerlifts & Strength", kind: "weight", higherBetter: true, unit: "lb", placeholder: "185", hint: "1-rep max" },
  { key: "power_clean", label: "Power Clean", category: "Powerlifts & Strength", kind: "weight", higherBetter: true, unit: "lb", placeholder: "155", hint: "1-rep max" },

  // ---- Conditioning (fastest time wins) ----
  { key: "mile_run", label: "1 Mile Run", category: "Conditioning", kind: "time", higherBetter: false, unit: "time", placeholder: "6:30", hint: "mm:ss" },
  { key: "row_500", label: "500m Row", category: "Conditioning", kind: "time", higherBetter: false, unit: "time", placeholder: "1:45", hint: "split, mm:ss" },
  { key: "row_2k", label: "2K Row", category: "Conditioning", kind: "time", higherBetter: false, unit: "time", placeholder: "7:30", hint: "mm:ss" },
  { key: "run_5k", label: "5K Run", category: "Conditioning", kind: "time", higherBetter: false, unit: "time", placeholder: "22:00", hint: "mm:ss" },
  { key: "sprint_400", label: "400m Sprint", category: "Conditioning", kind: "time", higherBetter: false, unit: "time", placeholder: "1:20", hint: "mm:ss" },

  // ---- Bodyweight & Skill ----
  { key: "pullups", label: "Max Pull-ups", category: "Bodyweight & Skill", kind: "reps", higherBetter: true, unit: "reps", placeholder: "12", hint: "unbroken" },
  { key: "pushups", label: "Max Push-ups", category: "Bodyweight & Skill", kind: "reps", higherBetter: true, unit: "reps", placeholder: "40", hint: "unbroken" },
  { key: "jump_rope", label: "Consecutive Jump Rope", category: "Bodyweight & Skill", kind: "reps", higherBetter: true, unit: "reps", placeholder: "150", hint: "unbroken" },
  { key: "double_unders", label: "Max Double-Unders", category: "Bodyweight & Skill", kind: "reps", higherBetter: true, unit: "reps", placeholder: "50", hint: "unbroken" },
  { key: "plank", label: "Plank Hold", category: "Bodyweight & Skill", kind: "time", higherBetter: true, unit: "time", placeholder: "2:00", hint: "longest hold, mm:ss" },
  { key: "vertical_jump", label: "Vertical Jump", category: "Bodyweight & Skill", kind: "distance", higherBetter: true, unit: "in", placeholder: "24", hint: "inches" },
  { key: "broad_jump", label: "Broad Jump", category: "Bodyweight & Skill", kind: "distance", higherBetter: true, unit: "in", placeholder: "90", hint: "inches" },
];

const BY_KEY = new Map(BENCHMARKS.map((b) => [b.key, b]));
export function benchmarkByKey(key: string): Benchmark | undefined {
  return BY_KEY.get(key);
}

/** Parse user input into a stored numeric value (seconds for time). null if invalid. */
export function parseBenchmarkInput(kind: BenchKind, raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (kind === "time") {
    // Accept "m:ss", "mm:ss", or a plain number of seconds.
    if (s.includes(":")) {
      const parts = s.split(":");
      if (parts.length !== 2) return null;
      const mins = Number(parts[0]);
      const secs = Number(parts[1]);
      if (!Number.isFinite(mins) || !Number.isFinite(secs) || secs < 0 || secs >= 60) return null;
      const total = mins * 60 + secs;
      return total > 0 ? total : null;
    }
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Format a stored value for display. */
export function formatBenchmarkValue(b: Benchmark, value: number): string {
  switch (b.kind) {
    case "weight":
      return `${trimNum(value)} lb`;
    case "reps":
      return `${trimNum(value)}`;
    case "distance":
      return `${trimNum(value)}"`;
    case "time": {
      const m = Math.floor(value / 60);
      const sec = Math.floor(value % 60);
      return `${m}:${String(sec).padStart(2, "0")}`;
    }
  }
}

/** Is `value` a new best vs the current best (or the first entry)? */
export function isBenchmarkBest(b: Benchmark, value: number, currentBest: number | null): boolean {
  if (currentBest == null) return true;
  return b.higherBetter ? value > currentBest : value < currentBest;
}

/** Pick the PR value from a set of logged values. */
export function bestValue(b: Benchmark, values: number[]): number | null {
  if (values.length === 0) return null;
  return b.higherBetter ? Math.max(...values) : Math.min(...values);
}

function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}
