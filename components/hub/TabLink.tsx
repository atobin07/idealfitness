"use client";

import { useDashboardTab } from "@/components/hub/DashboardShell";

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
  const select = useDashboardTab();
  return (
    <button type="button" onClick={() => select(tab)} className={className}>
      {children}
    </button>
  );
}
