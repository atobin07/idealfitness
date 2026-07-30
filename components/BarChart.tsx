export type Bar = { label: string; value: number };

export function BarChart({ bars, format }: { bars: Bar[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="flex h-40 items-end gap-2">
      {bars.map((b, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-slate-500">
            {b.value > 0 ? (format ? format(b.value) : b.value) : ""}
          </span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-gradient-to-t from-brand-600 to-brand-400"
              style={{ height: `${Math.max(2, (b.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] muted">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
