"use client";

import { useHubTab } from "@/components/TabHub";

/** A button that switches the dashboard tab in place (no navigation). */
export function TabLink({
  tab,
  className,
  children,
}: {
  tab: string;
  className?: string;
  children: React.ReactNode;
}) {
  const select = useHubTab();
  return (
    <button type="button" onClick={() => select(tab)} className={className}>
      {children}
    </button>
  );
}
