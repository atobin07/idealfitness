"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { createSession, setSessionStatus } from "@/app/(app)/calendar/actions";
import { bookClass, cancelBooking } from "@/app/(app)/classes/actions";
import { statusBadge, statusLabel } from "@/lib/format";
import type { UserRole } from "@/lib/database.types";

export type CalSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location: string | null;
  trainer_id: string;
  client_id: string | null;
  otherName: string;
};

export type CalClass = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  trainer_id: string;
  capacity: number;
  location: string | null;
  booked: number;
  waitlisted: number;
  myStatus: "booked" | "waitlisted" | null;
};

type Person = { id: string; full_name: string };
export type AvailWindow = { weekday: number; startMin: number; endMin: number };
export type BusyBlock = { starts_at: string; ends_at: string };

const START_HOUR = 6;
const END_HOUR = 21;
const PX_PER_HOUR = 52;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const GRID_START = START_HOUR * 60;
const GRID_END = END_HOUR * 60;

// Given a weekday's availability windows, return the grey "outside hours" bands
// (the complement of the merged available windows within the visible grid).
function offHoursBands(weekday: number, avail: AvailWindow[]) {
  const windows = avail
    .filter((a) => a.weekday === weekday)
    .map((a) => [Math.max(GRID_START, a.startMin), Math.min(GRID_END, a.endMin)] as [number, number])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const w of windows) {
    const last = merged[merged.length - 1];
    if (last && w[0] <= last[1]) last[1] = Math.max(last[1], w[1]);
    else merged.push([...w]);
  }
  const bands: [number, number][] = [];
  let cursor = GRID_START;
  for (const [s, e] of merged) {
    if (s > cursor) bands.push([cursor, s]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < GRID_END) bands.push([cursor, GRID_END]);
  return bands.map(([s, e]) => ({
    top: ((s - GRID_START) / 60) * PX_PER_HOUR,
    height: ((e - s) / 60) * PX_PER_HOUR,
  }));
}

function isAvailable(weekday: number, min: number, avail: AvailWindow[]) {
  return avail.some((a) => a.weekday === weekday && min >= a.startMin && min < a.endMin);
}

function minutesFromTop(y: number) {
  const raw = (y / PX_PER_HOUR) * 60;
  // Snap to 15-minute increments so 10:15 / 10:30 / 10:45 are all selectable.
  return Math.max(0, Math.min((END_HOUR - START_HOUR) * 60 - 15, Math.round(raw / 15) * 15));
}

function statusBlockColor(status: string) {
  switch (status) {
    case "completed": return "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:from-white/10 dark:to-white/[0.04] dark:text-slate-300 dark:ring-white/10";
    case "cancelled": return "bg-gradient-to-br from-rose-50 to-rose-100 text-rose-500 line-through shadow-sm ring-1 ring-rose-200/70 dark:from-rose-500/15 dark:to-rose-500/5 dark:text-rose-300 dark:ring-rose-500/20";
    case "no_show": return "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200/70 dark:from-amber-500/15 dark:to-amber-500/5 dark:text-amber-300 dark:ring-amber-500/20";
    default: return "bg-gradient-to-br from-brand-400 to-brand-500 text-white shadow-md shadow-brand-500/30 ring-1 ring-white/25";
  }
}

export function WeekCalendar({
  days,
  sessions,
  classes,
  role,
  people,
  myId,
  avail = [],
  coaches = [],
  selectedCoach,
  busy = [],
}: {
  days: string[]; // yyyy-MM-dd for each column
  sessions: CalSession[];
  classes: CalClass[];
  role: UserRole;
  people: Person[];
  myId: string;
  avail?: AvailWindow[];
  coaches?: Person[];
  selectedCoach?: string;
  busy?: BusyBlock[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isClient = role === "client";
  const coachName = coaches.find((c) => c.id === selectedCoach)?.full_name;

  function pickCoach(id: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("coach", id);
    router.push(`${pathname}?${p.toString()}`);
  }
  const [prefill, setPrefill] = useState<{ date: string; time: string } | null>(null);
  const [selected, setSelected] = useState<CalSession | null>(null);
  const [selectedClass, setSelectedClass] = useState<CalClass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  void myId;

  const counterpartLabel = role === "trainer" ? "Client" : "Trainer";

  const byDay = useMemo(() => {
    const m = new Map<string, CalSession[]>();
    for (const d of days) m.set(d, []);
    for (const s of sessions) {
      const key = format(new Date(s.starts_at), "yyyy-MM-dd");
      if (m.has(key)) m.get(key)!.push(s);
    }
    return m;
  }, [days, sessions]);

  const classesByDay = useMemo(() => {
    const m = new Map<string, CalClass[]>();
    for (const d of days) m.set(d, []);
    for (const c of classes) {
      const key = format(new Date(c.starts_at), "yyyy-MM-dd");
      if (m.has(key)) m.get(key)!.push(c);
    }
    return m;
  }, [days, classes]);

  const busyByDay = useMemo(() => {
    const m = new Map<string, BusyBlock[]>();
    for (const d of days) m.set(d, []);
    for (const b of busy) {
      const key = format(new Date(b.starts_at), "yyyy-MM-dd");
      if (m.has(key)) m.get(key)!.push(b);
    }
    return m;
  }, [days, busy]);

  const nowTop = useMemo(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
    if (mins < 0 || mins > (END_HOUR - START_HOUR) * 60) return null;
    return (mins / 60) * PX_PER_HOUR;
  }, []);

  function openSlot(dayISO: string, y: number) {
    const mins = minutesFromTop(y);
    const weekday = new Date(dayISO + "T00:00:00").getDay();
    // When availability is configured, only let people book inside a trainer window.
    if (avail.length > 0 && !isAvailable(weekday, GRID_START + mins, avail)) {
      setNotice("That time is outside trainer availability. Shaded areas can't be booked.");
      return;
    }
    const h = START_HOUR + Math.floor(mins / 60);
    const m = mins % 60;
    setError(null);
    setNotice(null);
    setPrefill({ date: dayISO, time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
  }

  async function submitBooking(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await createSession(undefined, formData);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setPrefill(null);
    router.refresh();
  }

  async function changeStatus(id: string, status: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    await setSessionStatus(fd);
    setSelected(null);
    router.refresh();
  }

  async function toggleClassBooking(c: CalClass) {
    setPending(true);
    const fd = new FormData();
    fd.set("class_id", c.id);
    if (c.myStatus) await cancelBooking(fd);
    else await bookClass(fd);
    setPending(false);
    setSelectedClass(null);
    router.refresh();
  }

  const todayISO = format(new Date(), "yyyy-MM-dd");
  const defaultDay = days.includes(todayISO) ? todayISO : days[0];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_20px_50px_-24px_rgba(10,137,187,0.28)] ring-1 ring-slate-900/5 dark:bg-ink-800 dark:ring-white/10">
      {/* Toolbar: coach filter + prominent booking CTA */}
      <div className="flex flex-col gap-3 bg-gradient-to-r from-brand-50/70 via-white to-white px-4 py-3 dark:from-brand-500/10 dark:via-ink-800 dark:to-ink-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {isClient && coaches.length > 0 && (
            <label className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coach</span>
              <div className="relative">
                <select
                  value={selectedCoach ?? ""}
                  onChange={(e) => pickCoach(e.target.value)}
                  className="cursor-pointer appearance-none rounded-full bg-white py-1.5 pl-3.5 pr-9 text-xs font-bold text-brand-700 shadow-sm ring-1 ring-brand-200/70 transition hover:ring-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-white/5 dark:text-brand-200 dark:ring-white/10"
                >
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </label>
          )}
        </div>
        {people.length > 0 && (
          <button
            onClick={() => { setError(null); setPrefill({ date: defaultDay, time: "09:00" }); }}
            className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-600/40 active:translate-y-0"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Book personal training
          </button>
        )}
      </div>

      {/* Instruction banner */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-gradient-to-r from-white to-brand-50/40 px-4 py-2.5 text-xs dark:from-ink-800 dark:to-brand-500/[0.06]">
        <span className="font-semibold text-brand-700 dark:text-brand-200">
          👆 Tap any open slot{coachName ? ` with ${coachName}` : ""} to book
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 font-medium text-slate-500 ring-1 ring-slate-200/70 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(100,116,139,0.3)_2px,rgba(100,116,139,0.3)_4px)]" /> off-hours</span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 font-medium text-slate-500 ring-1 ring-slate-200/70 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10">🔒 booked</span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 font-medium text-slate-500 ring-1 ring-slate-200/70 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-ink-700 to-ink-900" /> group class</span>
      </div>
      {notice && (
        <div className="flex items-center justify-between gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="shrink-0 font-semibold hover:underline">Dismiss</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Day headers */}
          <div className="sticky top-0 z-30 flex bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.05)] backdrop-blur-md dark:bg-ink-800/85 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
            <div className="w-14 shrink-0" />
            {days.map((d) => {
              const date = new Date(d + "T00:00:00");
              const today = isSameDay(date, new Date());
              const weekend = [0, 6].includes(date.getDay());
              return (
                <div key={d} className="flex-1 py-2.5 text-center">
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${weekend ? "text-slate-300 dark:text-slate-500" : "text-slate-400"}`}>{format(date, "EEE")}</p>
                  <p className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-transform ${today ? "scale-105 bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-600/35" : "text-ink-900 dark:text-white"}`}>
                    {format(date, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Grid body — pt-2 keeps the first hour label from being clipped */}
          <div className="relative flex pt-2">
            {/* Hour gutter */}
            <div className="w-14 shrink-0">
              {HOURS.map((h) => (
                <div key={h} style={{ height: PX_PER_HOUR }} className="relative">
                  <span className="absolute -top-2 right-2 text-[10px] font-semibold tracking-wide text-slate-300 dark:text-slate-500">
                    {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d) => {
              const colDate = new Date(d + "T00:00:00");
              const colToday = isSameDay(colDate, new Date());
              return (
              <div
                key={d}
                className={`relative flex-1 transition-colors [&:not(:first-child)]:shadow-[inset_1px_0_0_rgba(15,23,42,0.04)] dark:[&:not(:first-child)]:shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] ${colToday ? "bg-gradient-to-b from-brand-50/60 via-brand-50/10 to-transparent dark:from-brand-500/[0.07] dark:via-brand-500/[0.02]" : ""}`}
                style={{ height: HOURS.length * PX_PER_HOUR }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  openSlot(d, e.clientY - rect.top);
                }}
              >
                {/* Hour lines — open hours invite a booking on hover */}
                {HOURS.map((h) => {
                  const weekday = colDate.getDay();
                  const openHour = avail.length === 0 || isAvailable(weekday, h * 60, avail) || isAvailable(weekday, h * 60 + 30, avail);
                  return (
                    <div
                      key={h}
                      style={{ height: PX_PER_HOUR }}
                      className={`group/cell relative border-b border-slate-100/70 dark:border-white/[0.04] ${openHour ? "cursor-pointer" : ""}`}
                    >
                      {openHour && (
                        <>
                          <span className="pointer-events-none absolute inset-x-1 inset-y-[3px] rounded-lg bg-gradient-to-br from-brand-50 to-brand-100/50 opacity-0 ring-1 ring-inset ring-brand-200/60 transition-opacity duration-150 group-hover/cell:opacity-100 dark:from-brand-500/15 dark:to-brand-500/5 dark:ring-brand-500/25" />
                          <span className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
                            <span className="scale-90 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-2.5 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg shadow-brand-600/30 transition-all duration-150 group-hover/cell:scale-100 group-hover/cell:opacity-100">
                              ＋ Book
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Off-hours shading (outside trainer availability) */}
                {avail.length > 0 &&
                  offHoursBands(colDate.getDay(), avail).map((b, i) => (
                    <div
                      key={`off-${i}`}
                      className="pointer-events-none absolute left-0 right-0 z-0 bg-slate-100/60 bg-[repeating-linear-gradient(45deg,transparent,transparent_7px,rgba(100,116,139,0.06)_7px,rgba(100,116,139,0.06)_14px)] dark:bg-black/20"
                      style={{ top: b.top, height: b.height }}
                    />
                  ))}

                {/* Now line */}
                {nowTop != null && isSameDay(colDate, new Date()) && (
                  <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: nowTop }}>
                    <div className="h-[2px] bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_8px_rgba(244,63,94,0.55)]" />
                    <div className="absolute -left-[3px] -top-[3px] h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] ring-2 ring-white dark:ring-ink-800" />
                  </div>
                )}

                {/* Booked (locked) blocks — coach is busy; times shown, not who */}
                {(busyByDay.get(d) ?? []).map((b, i) => {
                  const start = new Date(b.starts_at);
                  const end = new Date(b.ends_at);
                  const startMin = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
                  const durMin = Math.max(30, (end.getTime() - start.getTime()) / 60000);
                  const top = (startMin / 60) * PX_PER_HOUR;
                  const height = (durMin / 60) * PX_PER_HOUR - 2;
                  return (
                    <div
                      key={`busy-${i}`}
                      onClick={(e) => { e.stopPropagation(); setNotice("That time is already booked. Pick an open slot."); }}
                      style={{ top: Math.max(0, top), height: Math.max(20, height) }}
                      className="absolute left-1 right-1 z-10 flex items-center gap-1.5 overflow-hidden rounded-lg bg-white/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(100,116,139,0.1)_5px,rgba(100,116,139,0.1)_10px)] px-2 py-1 text-[11px] font-semibold text-slate-400 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-[2px] dark:bg-white/[0.06] dark:text-slate-400 dark:ring-white/10"
                    >
                      <span>🔒</span>
                      <span className="truncate">{format(start, "h:mm")} Booked</span>
                    </div>
                  );
                })}

                {/* Session blocks */}
                {(byDay.get(d) ?? []).map((s) => {
                  const start = new Date(s.starts_at);
                  const end = new Date(s.ends_at);
                  const startMin = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
                  const durMin = Math.max(30, (end.getTime() - start.getTime()) / 60000);
                  const top = (startMin / 60) * PX_PER_HOUR;
                  const height = (durMin / 60) * PX_PER_HOUR - 2;
                  return (
                    <button
                      key={s.id}
                      onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                      style={{ top: Math.max(0, top), height: Math.max(20, height) }}
                      className={`group/ev absolute left-1 right-1 z-10 overflow-hidden rounded-lg px-2 py-1 text-left text-[11px] leading-tight transition-all duration-200 hover:z-20 hover:-translate-y-0.5 hover:shadow-xl ${statusBlockColor(s.status)}`}
                    >
                      <span className="block truncate font-bold">{format(start, "h:mm")} {s.title}</span>
                      <span className="block truncate opacity-90">{s.otherName}</span>
                    </button>
                  );
                })}

                {/* Class blocks */}
                {(classesByDay.get(d) ?? []).map((c) => {
                  const start = new Date(c.starts_at);
                  const end = new Date(c.ends_at);
                  const startMin = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
                  const durMin = Math.max(30, (end.getTime() - start.getTime()) / 60000);
                  const top = (startMin / 60) * PX_PER_HOUR;
                  const height = (durMin / 60) * PX_PER_HOUR - 2;
                  const full = c.booked >= c.capacity;
                  return (
                    <button
                      key={c.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedClass(c); }}
                      style={{ top: Math.max(0, top), height: Math.max(20, height) }}
                      className={`group/cls absolute left-1 right-1 z-10 overflow-hidden rounded-lg px-2 py-1 text-left text-[11px] leading-tight text-white transition-all duration-200 hover:z-20 hover:-translate-y-0.5 hover:shadow-xl ${
                        c.myStatus === "booked"
                          ? "bg-gradient-to-br from-ink-800 to-ink-900 shadow-lg shadow-ink-900/30 ring-1 ring-brand-400/50"
                          : "bg-gradient-to-br from-ink-700 to-ink-900 shadow-md shadow-ink-900/25 ring-1 ring-white/15"
                      }`}
                    >
                      <span className="block truncate font-bold">{format(start, "h:mm")} {c.title}</span>
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-white/20 px-1.5 py-px text-[10px] font-semibold">
                        {c.myStatus ? (c.myStatus === "booked" ? "✓ Booked" : "Waitlisted") : full ? "Class full" : `${c.capacity - c.booked} spots left`}
                      </span>
                    </button>
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking dialog */}
      {prefill && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setPrefill(null)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">New appointment</h2>
              <button onClick={() => setPrefill(null)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {people.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-700 dark:bg-amber-500/10">
                {role === "trainer"
                  ? "You have no clients yet. Add one from the Clients page first."
                  : "You aren't linked to a trainer yet. Connect from the My Trainer page."}
              </p>
            ) : (
              <form ref={formRef} action={submitBooking} className="space-y-4">
                <div>
                  <label className="label">{counterpartLabel}</label>
                  <select name="counterpart_id" required defaultValue={isClient ? selectedCoach ?? "" : people.length === 1 ? people[0].id : ""} className="input">
                    <option value="" disabled>Select a {counterpartLabel.toLowerCase()}…</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Title</label>
                  <input name="title" className="input" defaultValue="Training session" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Date</label>
                    <input name="date" type="date" required defaultValue={prefill.date} className="input" />
                  </div>
                  <div>
                    <label className="label">Time</label>
                    <input name="time" type="time" required defaultValue={prefill.time} step={900} className="input" />
                  </div>
                  <div>
                    <label className="label">Duration</label>
                    <select name="duration" defaultValue="60" className="input">
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input name="location" className="input" placeholder="Optional" />
                </div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setPrefill(null)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Booking…" : "Book appointment"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Session detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className={`badge ${statusBadge(selected.status)}`}>{statusLabel(selected.status)}</span>
              <button onClick={() => setSelected(null)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white">{selected.title}</h2>
            <p className="mt-1 text-sm muted">
              {format(new Date(selected.starts_at), "EEEE, MMM d · h:mm a")} – {format(new Date(selected.ends_at), "h:mm a")}
            </p>
            <p className="text-sm muted">with {selected.otherName}{selected.location ? ` · ${selected.location}` : ""}</p>

            {selected.status === "scheduled" && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
                {role === "trainer" && (
                  <>
                    <button onClick={() => changeStatus(selected.id, "completed")} className="btn-secondary text-xs">Mark completed</button>
                    <button onClick={() => changeStatus(selected.id, "no_show")} className="btn-ghost text-xs text-amber-600">No-show</button>
                  </>
                )}
                <button onClick={() => changeStatus(selected.id, "cancelled")} className="btn-ghost text-xs text-red-600">Cancel appointment</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Class detail / booking */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setSelectedClass(null)}>
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className="badge bg-gradient-to-r from-ink-700 to-ink-900 text-white">Group class</span>
              <button onClick={() => setSelectedClass(null)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white">{selectedClass.title}</h2>
            <p className="mt-1 text-sm muted">
              {format(new Date(selectedClass.starts_at), "EEEE, MMM d · h:mm a")} – {format(new Date(selectedClass.ends_at), "h:mm a")}
              {selectedClass.location ? ` · ${selectedClass.location}` : ""}
            </p>
            <p className="mt-1 text-sm muted">
              {selectedClass.booked}/{selectedClass.capacity} booked
              {selectedClass.waitlisted > 0 ? ` · ${selectedClass.waitlisted} waitlisted` : ""}
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-ink-700 to-ink-900 dark:from-ink-600 dark:to-ink-800" style={{ width: `${Math.min(100, (selectedClass.booked / Math.max(1, selectedClass.capacity)) * 100)}%` }} />
            </div>

            {/* Anyone with app access can book a group class — the only exception
                is the coach who runs it, who manages the roster instead. */}
            {selectedClass.trainer_id !== myId ? (
              <button onClick={() => toggleClassBooking(selectedClass)} disabled={pending} className={`mt-4 w-full ${selectedClass.myStatus ? "btn-secondary" : "btn-primary"}`}>
                {pending
                  ? "Working…"
                  : selectedClass.myStatus
                  ? `Cancel ${selectedClass.myStatus === "waitlisted" ? "waitlist spot" : "booking"}`
                  : selectedClass.booked >= selectedClass.capacity
                  ? "Add me to the waitlist"
                  : "I'll be there crushing it! 💪"}
              </button>
            ) : (
              <p className="mt-4 text-xs muted">You run this class — manage the roster on the Classes page.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
