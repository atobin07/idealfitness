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
  src,
  seed,
  size = "md",
}: {
  name: string;
  src?: string | null;
  seed?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dims =
    size === "xl"
      ? "h-24 w-24 text-2xl"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : size === "sm"
      ? "h-8 w-8 text-xs"
      : "h-10 w-10 text-sm";

  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={src} alt={name} className={`${dims} shrink-0 rounded-full object-cover`} />
    );
  }

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
