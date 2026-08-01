"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/(app)/messages/actions";
import { EmojiPicker } from "@/components/messages/EmojiPicker";
import { GifPicker } from "@/components/messages/GifPicker";
import { FONT_OPTIONS, fontClass, type MsgFont } from "@/lib/messageFonts";

type Member = { id: string; full_name: string };
type Pending = { kind: "image" | "file" | "gif"; url?: string; file?: File; name: string; preview: string };

export function MessageComposer({ recipientId, myId, members }: { recipientId: string; myId: string; members: Member[] }) {
  const router = useRouter();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [font, setFont] = useState<MsgFont>("default");
  const [fontOpen, setFontOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  function insert(text: string) {
    const ta = taRef.current;
    if (!ta) { setBody((b) => b + text); return; }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + text.length; });
  }

  function pickFile(f: File | null) {
    if (!f) return;
    const isImg = f.type.startsWith("image/");
    const isGif = f.type === "image/gif";
    setPending({ kind: isGif ? "gif" : isImg ? "image" : "file", file: f, name: f.name, preview: isImg ? URL.createObjectURL(f) : "" });
  }

  async function send() {
    if (!body.trim() && !pending) return;
    setBusy(true);
    try {
      let attachmentUrl = pending?.url ?? "";
      let attachmentType = pending?.kind ?? "";
      let attachmentName = pending?.name ?? "";

      if (pending?.file) {
        const supabase = createClient();
        const ext = pending.file.name.split(".").pop() || "bin";
        const path = `${myId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("message-media").upload(path, pending.file);
        if (error) throw new Error(error.message);
        attachmentUrl = supabase.storage.from("message-media").getPublicUrl(path).data.publicUrl;
      }

      const fd = new FormData();
      fd.set("recipient_id", recipientId);
      fd.set("body", body);
      fd.set("font", font);
      if (attachmentUrl) {
        fd.set("attachment_url", attachmentUrl);
        fd.set("attachment_type", attachmentType);
        fd.set("attachment_name", attachmentName);
      }
      await sendMessage(fd);
      setBody("");
      setPending(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-ink-800">
      {pending && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 p-2 dark:bg-white/10">
          {pending.preview || pending.kind === "gif" ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={pending.preview || pending.url} alt="" className="h-14 w-14 rounded object-cover" />
          ) : (
            <span className="text-2xl">📎</span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-ink-900 dark:text-white">{pending.name || "attachment"}</span>
          <button onClick={() => { setPending(null); if (fileRef.current) fileRef.current.value = ""; }} className="btn-ghost p-1" aria-label="Remove">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <div className="flex items-center">
          <EmojiPicker onPick={insert} />
          <GifPicker onPick={(url) => setPending({ kind: "gif", url, name: "GIF", preview: url })} />
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost p-2" aria-label="Attach">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />

          {/* Font picker */}
          <div className="relative">
            <button type="button" onClick={() => setFontOpen((o) => !o)} className={`btn-ghost px-2 py-1.5 text-sm ${fontClass(font)}`} aria-label="Font">Aa</button>
            {fontOpen && (
              <div className="absolute bottom-full left-0 z-40 mb-2 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-ink-800">
                {FONT_OPTIONS.map((f) => (
                  <button key={f.value} type="button" onClick={() => { setFont(f.value); setFontOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-white/10 ${font === f.value ? "bg-brand-50 dark:bg-brand-500/15" : ""}`}>
                    <span className={`text-base ${f.className}`}>The quick fox</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mention */}
          {members.length > 0 && (
            <div className="relative">
              <button type="button" onClick={() => setMentionOpen((o) => !o)} className="btn-ghost px-2 py-1.5 text-sm font-semibold" aria-label="Mention">@</button>
              {mentionOpen && (
                <div className="absolute bottom-full left-0 z-40 mb-2 max-h-48 w-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-ink-800">
                  {members.map((m) => (
                    <button key={m.id} type="button" onClick={() => { insert(`@${m.full_name.split(" ")[0]} `); setMentionOpen(false); }}
                      className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/10">
                      @{m.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <textarea
          ref={taRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={1}
          placeholder="Write a message…"
          className={`input max-h-32 min-h-[42px] flex-1 resize-none ${fontClass(font)}`}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button type="button" onClick={send} disabled={busy || (!body.trim() && !pending)} className="btn-primary h-[42px]">
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
