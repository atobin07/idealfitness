export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  // Athletic "runner in a ring" mark inspired by the iDEAL FITNESS logo.
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="iDEAL FITNESS">
      <ellipse cx="32" cy="32" rx="28" ry="29" fill="none" className="stroke-brand-400" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="150 22" transform="rotate(-18 32 32)" />
      {/* head */}
      <circle cx="39" cy="16" r="5.2" className="fill-brand-500" />
      {/* body + trailing leg (follows text color of its container) */}
      <path d="M20 30 C29 25 33 27 34 33 C35 40 30 44 25 50" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* forward stride swoosh (blue) */}
      <path d="M31 33 C39 31 46 36 47 47" fill="none" className="stroke-brand-500" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  className = "",
  size = "md",
  showMark = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  showMark?: boolean;
}) {
  const markSize = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showMark && <LogoMark className={markSize} />}
      <span className={`${text} font-black leading-none tracking-tight`}>
        <span>i</span>
        <span className="text-brand-400">DEAL</span>{" "}
        <span className="font-semibold tracking-[0.15em]">FITNESS</span>
      </span>
    </div>
  );
}
