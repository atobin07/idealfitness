"use client";

import { useEffect, useRef, useState } from "react";

const EMOJIS =
  "😀 😄 😁 😂 🤣 😊 😍 😘 😎 🤩 🥳 😜 🤪 😅 😇 🙃 🤗 🤔 😴 😭 😤 😡 🥺 😱 👍 👎 👏 🙌 👊 ✊ 🤝 🙏 💪 👌 ✌️ 🤞 👋 🤙 ❤️ 🧡 💛 💚 💙 💜 🖤 🔥 ✨ ⭐ 🎉 🎊 💯 ✅ ❌ ⚡ 🏋️ 🤸 🏃 🚴 🧘 🥇 🏆 🥊 🍎 🥤 💦 🐶 🎯 📣 ☕".split(
    " "
  );

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="btn-ghost p-2" aria-label="Emoji">
        <span className="text-lg leading-none">😊</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-ink-800">
          <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto">
            {EMOJIS.map((e, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onPick(e); setOpen(false); }}
                className="rounded-md p-1 text-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
