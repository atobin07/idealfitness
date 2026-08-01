"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createEvent } from "@/app/(app)/events/actions";
import type { EventKind } from "@/lib/database.types";

export function CreateEventDialog({ myId, defaultDate }: { myId: string; defaultDate: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EventKind>("gym");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function pickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function reset() {
    setKind("gym");
    pickFile(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
    formRef.current?.reset();
  }

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      let imageUrl = "";
      if (file) {
        const supabase = createClient();
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${myId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-media").upload(path, file);
        if (upErr) throw new Error(upErr.message);
        imageUrl = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      }
      formData.set("kind", kind);
      if (imageUrl) formData.set("image_url", imageUrl);
      const res = await createEvent(undefined, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>+ New event</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Post an event</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setKind("gym")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${kind === "gym" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"}`}>🏋️ Gym event</button>
              <button type="button" onClick={() => setKind("social")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${kind === "social" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"}`}>🎉 Non-gym event</button>
            </div>

            <form ref={formRef} action={submit} className="space-y-4">
              <div>
                <label className="label" htmlFor="e-title">Event name</label>
                <input id="e-title" name="title" required className="input" placeholder={kind === "gym" ? "Saturday Partner WOD" : "Team dinner at Tony's"} />
              </div>
              <div>
                <label className="label" htmlFor="e-desc">Details</label>
                <textarea id="e-desc" name="description" rows={3} className="input" placeholder="What's happening, what to bring, who's invited…" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="e-date">Date</label>
                  <input id="e-date" name="date" type="date" required className="input" defaultValue={defaultDate} />
                </div>
                <div>
                  <label className="label" htmlFor="e-time">Start</label>
                  <input id="e-time" name="time" type="time" required className="input" defaultValue="17:00" step={900} />
                </div>
                <div>
                  <label className="label" htmlFor="e-end">End</label>
                  <input id="e-end" name="end_time" type="time" className="input" step={900} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="e-loc">Location</label>
                <input id="e-loc" name="location" className="input" placeholder="iDEAL Fitness · or an address" />
              </div>

              {preview && (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="max-h-56 rounded-lg" />
                  <button type="button" onClick={() => { pickFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white" aria-label="Remove photo">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost gap-1.5 px-2 py-1.5 text-sm">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Add photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={busy} className="btn-primary">{busy ? "Posting…" : "Post event"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
