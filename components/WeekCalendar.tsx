"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  capacity: number;
  location: string | null;
  booked: number;
  waitlisted: number;
  myStatus: "booked" | "waitlisted" | null;
};

type Person = { id: string; full_name: string };

const START_HOUR = 6;
const END_HOUR = 21;
const PX_PER_HOUR = 52;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function minutesFromTop(y: number) {
  const raw = (y / PX_PER_HOUR) * 60;
  return Math.max(0, Math.min((END_HOUR - START_HOUR) * 60 - 30, Math.round(raw / 30) * 30));
}

function statusBlockColor(status: string) {
  switch (status) {
    case "completed": return "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";
    case "cancelled": return "border-red-200 bg-red-50 text-red-600 line-through dark:border-red-500/20 dark:bg-red-500/10";
    case "no_show": return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10";
    default: return "border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-200";
  }
}

export function WeekCalendar({
  days,
  sessions,
  classes,
  role,
  people,
  myId,
}: {
  days: string[]; // yyyy-MM-dd for each column
  sessions: CalSession[];
  classes: CalClass[];
  role: UserRole;
  people: Person[];
  myId: string;
}) {
  const router = useRouter();
  const [prefill, setPrefill] = useState<{ date: string; time: string } | null>(null);
  const [selected, setSelected] = useState<CalSession | null>(null);
  const [selectedClass, setSelectedClass] = useState<CalClass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  void myId;

  const counterpartLabel = role === "trainer" ? "Client" : "Trainer";
  const singleDay = days.length === 1;

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

  const nowTop = useMemo(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
    if (mins < 0 || mins > (END_HOUR - START_HOUR) * 60) return null;
    return (mins / 60) * PX_PER_HOUR;
  }, []);

  function openSlot(dayISO: string, y: number) {
    const mins = minutesFromTop(y);
    const h = START_HOUR + Math.floor(mins / 60);
    const m = mins % 60;
    setError(null);
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
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <p className="text-xs muted">Click any open slot to book · <span className="text-violet-500">violet</span> = group class</p>
        {people.length > 0 && (
          <button onClick={() => { setError(null); setPrefill({ date: defaultDay, time: "09:00" }); }} className="btn-primary px-3 py-1.5 text-xs">
            + New appointment
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Day headers */}
          <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-white dark:border-white/10 dark:bg-ink-800">
            <div className="w-14 shrink-0" />
            {days.map((d) => {
              const date = new Date(d + "T00:00:00");
              const today = isSameDay(date, new Date());
              return (
                <div key={d} className={`flex-1 border-l border-slate-100 py-2 text-center dark:border-white/10 ${singleDay ? "" : ""}`}>
                  <p className="text-[11px] font-medium uppercase muted">{format(date, "EEE")}</p>
                  <p className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${today ? "bg-brand-600 text-white" : "text-ink-900 dark:text-white"}`}>
                    {format(date, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Grid body */}
          <div className="relative flex">
            {/* Hour gutter */}
            <div className="w-14 shrink-0">
              {HOURS.map((h) => (
                <div key={h} style={{ height: PX_PER_HOUR }} className="relative">
                  <span className="absolute -top-2 right-1 text-[10px] muted">
                    {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d) => (
              <div
                key={d}
                className="relative flex-1 border-l border-slate-100 dark:border-white/10"
                style={{ height: HOURS.length * PX_PER_HOUR }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  openSlot(d, e.clientY - rect.top);
                }}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div key={h} style={{ height: PX_PER_HOUR }} className="border-b border-slate-100 hover:bg-brand-50/40 dark:border-white/5 dark:hover:bg-white/5" />
                ))}

                {/* Now line */}
                {nowTop != null && isSameDay(new Date(d + "T00:00:00"), new Date()) && (
                  <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: nowTop }}>
                    <div className="h-px bg-red-500" />
                    <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                  </div>
                )}

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
                      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-md border px-2 py-1 text-left text-[11px] leading-tight shadow-sm ${statusBlockColor(s.status)}`}
                    >
                      <span className="block font-semibold">{format(start, "h:mm")} {s.title}</span>
                      <span className="block truncate opacity-80">{s.otherName}</span>
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
                      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-[11px] leading-tight shadow-sm ${
                        c.myStatus === "booked"
                          ? "border-violet-500 bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
                          : "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200"
                      }`}
                    >
                      <span className="block font-semibold">{format(start, "h:mm")} {c.title}</span>
                      <span className="block truncate opacity-80">
                        {c.myStatus ? (c.myStatus === "booked" ? "✓ Booked" : "Waitlisted") : full ? "Class full" : `${c.capacity - c.booked} spots`}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
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
                  <select name="counterpart_id" required defaultValue={people.length === 1 ? people[0].id : ""} className="input">
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
                  <input name="location" className="input" placeholder="Main floor" />
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
              <span className="badge bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">Group class</span>
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
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, (selectedClass.booked / Math.max(1, selectedClass.capacity)) * 100)}%` }} />
            </div>

            {role === "client" && (
              <button onClick={() => toggleClassBooking(selectedClass)} disabled={pending} className={`mt-4 w-full ${selectedClass.myStatus ? "btn-secondary" : "btn-primary"}`}>
                {pending
                  ? "Working…"
                  : selectedClass.myStatus
                  ? `Cancel ${selectedClass.myStatus === "waitlisted" ? "waitlist spot" : "booking"}`
                  : selectedClass.booked >= selectedClass.capacity
                  ? "Join waitlist"
                  : "Book my spot"}
              </button>
            )}
            {role === "trainer" && (
              <p className="mt-4 text-xs muted">Manage classes and rosters on the Classes page.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
