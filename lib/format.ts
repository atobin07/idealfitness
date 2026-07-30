import { format, isToday, isTomorrow, isYesterday } from "date-fns";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

export function timeRange(start: string, end: string): string {
  return `${format(new Date(start), "h:mm a")} – ${format(new Date(end), "h:mm a")}`;
}

export function shortTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-brand-100 text-brand-700",
  completed: "bg-slate-200 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-amber-100 text-amber-700",
};

export function statusBadge(status: string): string {
  return STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
}

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");
}
