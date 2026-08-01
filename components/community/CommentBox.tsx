"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/app/(app)/community/actions";
import { Avatar } from "@/components/Avatar";

export function CommentBox({ postId, myName }: { postId: string; myName: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("post_id", postId);
    fd.set("body", text);
    await addComment(fd);
    setBody("");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar name={myName} size="sm" />
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Write a comment…"
        className="input flex-1 rounded-full py-1.5"
        disabled={busy}
      />
      <button onClick={submit} disabled={busy || !body.trim()} className="btn-primary shrink-0 rounded-full px-4 py-1.5 text-sm">
        Send
      </button>
    </div>
  );
}
