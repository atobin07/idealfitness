"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postResponse } from "@/app/(app)/topic/actions";
import { Avatar } from "@/components/Avatar";

export function TopicResponseBox({ discussionId, myName, myAvatar }: { discussionId: string; myName: string; myAvatar?: string | null }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("discussion_id", discussionId);
    fd.set("body", text);
    await postResponse(fd);
    setBody("");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-start gap-2">
      <Avatar name={myName} src={myAvatar} size="sm" />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="Make your case…"
        className="input flex-1 resize-none"
        disabled={busy}
      />
      <button onClick={submit} disabled={busy || !body.trim()} className="btn-primary shrink-0">
        {busy ? "…" : "Weigh in"}
      </button>
    </div>
  );
}
