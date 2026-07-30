"use client";

import { useState } from "react";
import { setSessionStatus } from "@/app/(app)/calendar/actions";

export function SessionActions({
  id,
  status,
  isTrainer,
}: {
  id: string;
  status: string;
  isTrainer: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (status !== "scheduled") return null;

  const options = isTrainer
    ? [
        { value: "completed", label: "Mark completed" },
        { value: "no_show", label: "Mark no-show" },
        { value: "cancelled", label: "Cancel session" },
      ]
    : [{ value: "cancelled", label: "Cancel session" }];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Session actions"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-ink-800">
          {options.map((opt) => (
            <form key={opt.value} action={setSessionStatus}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={opt.value} />
              <button
                type="submit"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 ${
                  opt.value === "cancelled" || opt.value === "no_show"
                    ? "text-red-600"
                    : "text-ink-800"
                }`}
              >
                {opt.label}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
