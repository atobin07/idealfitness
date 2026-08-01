"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPost } from "@/app/(app)/community/actions";
import { Avatar } from "@/components/Avatar";
import type { PostKind } from "@/lib/database.types";

type Person = { id: string; full_name: string };

const KINDS: { value: PostKind; label: string; emoji: string; adminOnly?: boolean }[] = [
  { value: "post", label: "Post", emoji: "📝" },
  { value: "shoutout", label: "Shoutout", emoji: "📣" },
  { value: "congrats", label: "Congrats", emoji: "🎉" },
  { value: "thank_you", label: "Thank you", emoji: "🙏" },
  { value: "announcement", label: "Announcement", emoji: "📢", adminOnly: true },
];

const PLACEHOLDERS: Record<PostKind, string> = {
  post: "Share a win, a photo, or what's on your mind…",
  shoutout: "Give a teammate a shoutout…",
  congrats: "Congratulate someone on their progress…",
  thank_you: "Say thanks to someone who helped you…",
  milestone: "Share a milestone…",
  announcement: "Broadcast an announcement to the whole gym…",
};

export function PostComposer({
  people,
  myId,
  myName,
  myAvatar,
  isAdmin = false,
  channel = "feed",
  variant = "full",
  placeholder,
}: {
  people: Person[];
  myId: string;
  myName: string;
  myAvatar?: string | null;
  isAdmin?: boolean;
  channel?: string;
  variant?: "full" | "simple";
  placeholder?: string;
}) {
  const showKinds = variant !== "simple";
  const kinds = KINDS.filter((k) => !k.adminOnly || isAdmin);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<PostKind>("post");
  const [body, setBody] = useState("");
  const [tagged, setTagged] = useState<Person[]>([]);
  const [showTag, setShowTag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const untaggedPeople = people.filter((p) => !tagged.some((t) => t.id === p.id));

  function pickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit() {
    if (!body.trim() && !file) {
      setError("Write something or add a photo.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let imageUrl = "";
      if (file) {
        const supabase = createClient();
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${myId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-media").upload(path, file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
        imageUrl = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      }
      const fd = new FormData();
      fd.set("kind", showKinds ? kind : "post");
      fd.set("channel", channel);
      fd.set("body", body);
      if (imageUrl) fd.set("image_url", imageUrl);
      for (const t of tagged) fd.append("tagged_ids", t.id);
      const res = await createPost(undefined, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setBody("");
      setTagged([]);
      setKind("post");
      pickFile(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_14px_36px_-18px_rgba(15,23,42,0.22)] dark:bg-ink-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
      <div className="flex gap-3">
        <Avatar name={myName} src={myAvatar} size="md" />
        <div className="flex-1">
          {/* Kind pills */}
          {showKinds && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {kinds.map((k) => (
              <button
                key={k.value}
                onClick={() => setKind(k.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  kind === k.value
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
                }`}
              >
                {k.emoji} {k.label}
              </button>
            ))}
          </div>
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={placeholder ?? PLACEHOLDERS[kind]}
            className="input resize-none"
          />

          {/* Tag chips */}
          {tagged.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
              <span className="muted">with</span>
              {tagged.map((t) => (
                <span key={t.id} className="badge gap-1 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {t.full_name}
                  <button onClick={() => setTagged(tagged.filter((x) => x.id !== t.id))} className="ml-0.5 hover:text-red-500" aria-label="Remove tag">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Image preview */}
          {preview && (
            <div className="relative mt-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="max-h-64 rounded-lg" />
              <button
                onClick={() => { pickFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                aria-label="Remove photo"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {/* Tag picker */}
          {showTag && untaggedPeople.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-slate-50 p-1 shadow-inner dark:bg-white/5">
              {untaggedPeople.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setTagged([...tagged, p]); if (untaggedPeople.length === 1) setShowTag(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Avatar name={p.full_name} size="sm" />
                  <span className="text-ink-900 dark:text-white">{p.full_name}</span>
                </button>
              ))}
            </div>
          )}

          {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => fileRef.current?.click()} className="btn-ghost gap-1.5 px-2 py-1.5 text-sm" type="button">
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Photo
              </button>
              <button onClick={() => setShowTag((s) => !s)} className="btn-ghost gap-1.5 px-2 py-1.5 text-sm" type="button" disabled={people.length === 0}>
                <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Tag
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            </div>
            <button onClick={submit} disabled={busy} className="btn-primary px-5">
              {busy ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
