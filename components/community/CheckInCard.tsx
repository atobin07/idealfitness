"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkIn } from "@/app/(app)/community/actions";

export function CheckInCard({ checkedInToday, streak }: { checkedInToday: boolean; streak: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(checkedInToday);
  const [flash, setFlash] = useState<string | null>(null);
  const [curStreak, setCurStreak] = useState(streak);

  async function go() {
    setPending(true);
    const res = await checkIn();
    setPending(false);
    if ("error" in res) {
      setFlash(res.error);
      return;
    }
    setDone(true);
    setCurStreak(res.streak);
    setFlash(res.already ? "You're already checked in today." : `+${res.points} points · ${res.streak}-day streak 🔥`);
    router.refresh();
  }

  return (
    <div className="relative flex flex-col items-start gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 p-5 text-white shadow-[0_16px_40px_-10px_rgba(10,137,187,0.6)] sm:flex-row sm:items-center sm:justify-between">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div>
        <p className="font-semibold text-white">
          {done ? "You're checked in today ✅" : "Are you at the gym?"}
        </p>
        <p className="text-sm text-white/75">
          {curStreak > 0 ? `${curStreak}-day streak — keep it alive.` : "Check in to start a streak and earn points."}
        </p>
        {flash && <p className="mt-1 text-sm font-medium text-white">{flash}</p>}
      </div>
      <button onClick={go} disabled={pending || done} className="btn-on-brand shrink-0 disabled:opacity-80">
        {pending ? "Checking in…" : done ? "Checked in" : "Check in now"}
      </button>
    </div>
  );
}
