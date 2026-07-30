import { initials } from "@/lib/format";

const COLORS = [
  "bg-brand-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

export function Avatar({
  name,
  seed,
  size = "md",
}: {
  name: string;
  seed?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(
        seed ?? name
      )}`}
    >
      {initials(name)}
    </div>
  );
}
