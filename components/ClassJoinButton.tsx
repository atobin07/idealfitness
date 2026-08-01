"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookClass, cancelBooking } from "@/app/(app)/classes/actions";
import { HYPE, YOURE_IN, randomOf } from "@/lib/hype";

type Status = "booked" | "waitlisted" | null;

export function ClassJoinButton({
  classId,
  status: initialStatus,
  full,
  initialPhrase,
}: {
  classId: string;
  status: Status;
  full: boolean;
  initialPhrase: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [phrase, setPhrase] = useState(initialPhrase);
  const [cheer, setCheer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join() {
    setBusy(true);
    const fd = new FormData();
    fd.set("class_id", classId);
    await bookClass(fd);
    setStatus(full ? "waitlisted" : "booked");
    setCheer(randomOf(YOURE_IN));
    setBusy(false);
    router.refresh();
  }

  async function leave() {
    setBusy(true);
    const fd = new FormData();
    fd.set("class_id", classId);
    await cancelBooking(fd);
    setStatus(null);
    setCheer(null);
    setPhrase(randomOf(HYPE)); // fresh hype next time they tap
    setBusy(false);
    router.refresh();
  }

  if (status) {
    const waitlisted = status === "waitlisted";
    return (
      <div className="mt-4">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-white/20 py-2.5 text-center font-semibold text-white ring-1 ring-white/30">
          {waitlisted ? "You're on the list 🙌" : "You're in! 💪"}
        </div>
        <p className="mt-1.5 text-center text-sm text-white/85">{cheer ?? (waitlisted ? "We'll grab you the moment a spot opens." : "See you on the floor!")}</p>
        <button onClick={leave} disabled={busy} className="mt-1 w-full text-center text-xs font-medium text-white/70 underline-offset-2 hover:text-white hover:underline">
          {busy ? "…" : "Can't make it? Let us know"}
        </button>
      </div>
    );
  }

  return (
    <button onClick={join} disabled={busy} className="btn-on-brand mt-4 w-full">
      {busy ? "…" : phrase}
    </button>
  );
}
