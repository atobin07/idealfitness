"use client";

import { useMemo, useState, useTransition } from "react";
import { Avatar } from "@/components/Avatar";
import { recordAttendance } from "@/app/(app)/check-in/actions";
import type { Database } from "@/lib/database.types";

type Status = Database["public"]["Enums"]["attendance_status"];
type Member = { id: string; full_name: string; avatar_url: string | null };
type ClassRow = { id: string; title: string; starts_at: string };
type Att = { member_id: string; class_id: string | null; status: Status };

const STATUSES: { value: Status; label: string; short: string; cls: string; active: string }[] = [
  { value: "present", label: "Present", short: "In", cls: "text-emerald-600", active: "bg-emerald-600 text-white" },
  { value: "no_show", label: "No-show", short: "No-show", cls: "text-rose-600", active: "bg-rose-600 text-white" },
  { value: "cancelled", label: "Cancelled", short: "Cancel", cls: "text-amber-600", active: "bg-amber-500 text-white" },
  { value: "excused", label: "Excused", short: "Excused", cls: "text-slate-500", active: "bg-slate-500 text-white" },
];

function keyOf(memberId: string, classId: string | null) {
  return `${memberId}|${classId ?? ""}`;
}

export function AttendanceBoard({
  today,
  members,
  classes,
  attendance,
}: {
  today: string;
  members: Member[];
  classes: ClassRow[];
  attendance: Att[];
}) {
  const [classId, setClassId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  // member+class → status
  const [statuses, setStatuses] = useState<Record<string, Status>>(() => {
    const m: Record<string, Status> = {};
    attendance.forEach((a) => (m[keyOf(a.member_id, a.class_id)] = a.status));
    return m;
  });

  const filtered = useMemo(
    () => members.filter((m) => m.full_name.toLowerCase().includes(query.trim().toLowerCase())),
    [members, query]
  );

  const counts = useMemo(() => {
    const c = { present: 0, no_show: 0, cancelled: 0, excused: 0 } as Record<Status, number>;
    members.forEach((m) => {
      const s = statuses[keyOf(m.id, classId)];
      if (s) c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [members, statuses, classId]);

  function mark(member: Member, status: Status) {
    const k = keyOf(member.id, classId);
    const prev = statuses[k];
    if (prev === status) return;
    setStatuses((s) => ({ ...s, [k]: status }));
    setBusyId(member.id);
    startTransition(async () => {
      const res = await recordAttendance({ memberId: member.id, status, classId, date: today });
      setBusyId(null);
      if (res.error) {
        setStatuses((s) => {
          const n = { ...s };
          if (prev) n[k] = prev;
          else delete n[k];
          return n;
        });
      }
    });
  }

  const selectedClass = classes.find((c) => c.id === classId);

  return (
    <div className="space-y-5">
      {/* Context bar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink-900 dark:text-white">Recording for</span>
          <select
            value={classId ?? ""}
            onChange={(e) => setClassId(e.target.value || null)}
            className="input h-9 w-auto py-1"
          >
            <option value="">Drop-in / personal training</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {new Date(c.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {c.title}
              </option>
            ))}
          </select>
          <span className="text-xs muted">
            {new Date(today + "T00:00:00").toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-emerald-600">✓ {counts.present} in</span>
          <span className="text-rose-600">{counts.no_show} no-show</span>
          <span className="text-amber-600">{counts.cancelled} cancelled</span>
        </div>
      </div>

      {selectedClass && (
        <p className="text-sm muted">
          Marking attendance for <span className="font-medium text-ink-900 dark:text-white">{selectedClass.title}</span>. Anyone booked
          who didn&apos;t show → tap <span className="font-medium text-rose-600">No-show</span>.
        </p>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search members…"
        className="input"
      />

      <div className="card divide-y divide-slate-100 dark:divide-white/10">
        {filtered.length === 0 && <div className="p-6 text-center muted">No members found.</div>}
        {filtered.map((m) => {
          const current = statuses[keyOf(m.id, classId)];
          return (
            <div key={m.id} className="flex items-center gap-3 p-3">
              <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{m.full_name}</p>
                {current && (
                  <p className={`text-xs ${STATUSES.find((s) => s.value === current)?.cls}`}>
                    {STATUSES.find((s) => s.value === current)?.label}
                    {current === "present" ? " · credited to their account" : ""}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => mark(m, s.value)}
                    disabled={pending && busyId === m.id}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                      current === s.value
                        ? s.active
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
                    }`}
                  >
                    {s.short}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
