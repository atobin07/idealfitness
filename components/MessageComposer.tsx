"use client";

import { useRef } from "react";
import { sendMessage } from "@/app/(app)/messages/actions";

export function MessageComposer({ recipientId }: { recipientId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await sendMessage(formData);
        formRef.current?.reset();
      }}
      className="flex items-end gap-2 border-t border-slate-200 bg-white p-3"
    >
      <input type="hidden" name="recipient_id" value={recipientId} />
      <textarea
        name="body"
        required
        rows={1}
        placeholder="Write a message…"
        className="input max-h-32 min-h-[42px] flex-1 resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <button type="submit" className="btn-primary h-[42px]">
        Send
      </button>
    </form>
  );
}
