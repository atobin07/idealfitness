import { format } from "date-fns";

export type ChartPoint = { date: string; value: number };

/**
 * Minimal, dependency-free, theme-aware line chart. One accent series with an
 * optional target line. Renders as responsive inline SVG.
 */
export function LineChart({
  points,
  unit,
  target,
  height = 180,
}: {
  points: ChartPoint[];
  unit?: string;
  target?: number | null;
  height?: number;
}) {
  const clean = points
    .filter((p) => p.value != null && !Number.isNaN(p.value))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (clean.length < 2) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-slate-50 text-sm muted dark:bg-white/5" style={{ height }}>
        Not enough data yet — log at least two entries.
      </div>
    );
  }

  const W = 600;
  const H = height;
  const padL = 40, padR = 12, padT = 12, padB = 24;

  const values = clean.map((p) => p.value);
  const ys = target != null ? [...values, target] : values;
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  min -= range * 0.1;
  max += range * 0.1;

  const x = (i: number) => padL + (i / (clean.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

  const line = clean.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `${padL},${H - padB} ${line} ${x(clean.length - 1)},${H - padB}`;
  const ticks = [max, (max + min) / 2, min];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" preserveAspectRatio="none" style={{ height }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="stroke-slate-200 dark:stroke-white/10" strokeWidth={1} />
          <text x={4} y={y(t) + 3} className="fill-slate-400 text-[10px]">{t.toFixed(1)}</text>
        </g>
      ))}

      {target != null && (
        <line x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} className="stroke-brand-400" strokeWidth={1.5} strokeDasharray="4 4" />
      )}

      <polygon points={area} className="fill-brand-500/10" />
      <polyline points={line} fill="none" className="stroke-brand-500" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {clean.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={3} className="fill-brand-600" />
      ))}

      {[0, Math.floor((clean.length - 1) / 2), clean.length - 1].map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === clean.length - 1 ? "end" : "middle"} className="fill-slate-400 text-[10px]">
          {format(new Date(clean[i].date + "T00:00:00"), "MMM d")}
        </text>
      ))}

      {unit && <text x={W - padR} y={padT + 2} textAnchor="end" className="fill-slate-400 text-[10px]">{unit}</text>}
    </svg>
  );
}
