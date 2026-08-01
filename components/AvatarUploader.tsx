"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/app/(app)/settings/actions";
import { Avatar } from "@/components/Avatar";

export function AvatarUploader({ myId, name, avatarUrl, role, email }: {
  myId: string; name: string; avatarUrl: string | null; role: string; email: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(avatarUrl);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${myId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const fd = new FormData();
      fd.set("avatar_url", url);
      await updateAvatar(fd);
      setCurrent(url);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 flex items-center gap-4">
      <button onClick={() => fileRef.current?.click()} className="group relative rounded-full" aria-label="Change photo">
        <Avatar name={name || "You"} src={current} size="xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
          {busy ? "…" : "Change"}
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      <div>
        <p className="text-lg font-semibold text-ink-900 dark:text-white">{name || "Your name"}</p>
        <p className="text-sm capitalize text-slate-500">{role}{email ? ` · ${email}` : ""}</p>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-700">
          {busy ? "Uploading…" : "Upload a photo"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
