/* eslint-disable @next/next/no-img-element */

// Renders the official iDEAL FITNESS logo. Use the "white" variant on dark
// surfaces (navy sidebar, auth gradient) and "color" on light backgrounds.
export function Logo({
  variant = "color",
  size = "md",
  className = "",
}: {
  variant?: "color" | "white" | "black";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src =
    variant === "white" ? "/logo-white.svg" : variant === "black" ? "/logo-black.svg" : "/logo.svg";
  const height = size === "lg" ? "h-11" : size === "sm" ? "h-7" : "h-9";
  return <img src={src} alt="iDEAL FITNESS" className={`${height} w-auto ${className}`} />;
}
