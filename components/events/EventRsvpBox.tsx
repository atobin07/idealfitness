"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setRsvp } from "@/app/(app)/events/actions";
import type { RsvpStatus } from "@/lib/database.types";

export function EventRsvpBox({
  eventId,
  myStatus,
  myNote,
}: {
  eventId: string;
  myStatus: RsvpStatus | null;
  myNote: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<RsvpStatus | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(myNote ?? "Sorry, I can't make it to this one!");

  async function respond(status: RsvpStatus, noteText?: string) {
    setBusy(status);
    const fd = new FormData();
    fd.set("event_id", eventId);
    fd.set("status", status);
    if (noteText) fd.set("note", noteText);
    await setRsvp(fd);
    setBusy(null);
    setShowNote(false);
    router.refresh();
  }

  const base = "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-60";
  const on = {
    going: "border-emerald-500 bg-emerald-500 text-white",
    maybe: "border-amber-500 bg-amber-500 text-white",
    cant: "border-rose-500 bg-rose-500 text-white",
  };
  const off = "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300";

  return (
    <div>
      <div className="flex gap-2">
        <button onClick={() => respond("going")} disabled={busy !== null} className={`${base} ${myStatus === "going" ? on.going : off}`}>
          {busy === "going" ? "…" : "✅ Going"}
        </button>
        <button onClick={() => respond("maybe")} disabled={busy !== null} className={`${base} ${myStatus === "maybe" ? on.maybe : off}`}>
          {busy === "maybe" ? "…" : "🤔 Maybe"}
        </button>
        <button onClick={() => setShowNote((s) => !s)} disabled={busy !== null} className={`${base} ${myStatus === "cant" ? on.cant : off}`}>
          😔 Can&apos;t make it
        </button>
      </div>

      {(showNote || (myStatus === "cant" && myNote)) && (
        <div className="mt-2 rounded-lg border border-slate-200 p-2 dark:border-white/10">
          {showNote ? (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="input resize-none text-sm"
                placeholder="Leave a note for the group…"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setShowNote(false)} className="btn-secondary px-3 py-1.5 text-xs">Cancel</button>
                <button onClick={() => respond("cant", note.trim())} disabled={busy !== null} className="btn-primary px-3 py-1.5 text-xs">
                  Send response
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm italic muted">“{myNote}”</p>
          )}
        </div>
      )}
    </div>
  );
}
