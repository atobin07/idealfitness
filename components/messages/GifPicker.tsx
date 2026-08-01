"use client";

import { useEffect, useRef, useState } from "react";

const KEY = process.env.NEXT_PUBLIC_TENOR_KEY || "LIVDSRZULELA"; // public demo key; override via env

type Gif = { preview: string; url: string };

export function GifPicker({ onPick }: { onPick: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const base = q.trim()
          ? `https://g.tenor.com/v1/search?q=${encodeURIComponent(q)}&`
          : `https://g.tenor.com/v1/trending?`;
        const res = await fetch(`${base}key=${KEY}&limit=18&media_filter=minimal&contentfilter=high`, { signal: ctl.signal });
        if (!res.ok) throw new Error("GIF search unavailable");
        const data = await res.json();
        const items: Gif[] = (data.results ?? [])
          .map((r: any) => {
            const m = r.media?.[0] ?? {};
            return { preview: m.tinygif?.url || m.nanogif?.url, url: m.gif?.url || m.mediumgif?.url || m.tinygif?.url };
          })
          .filter((g: Gif) => g.preview && g.url);
        setGifs(items);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Couldn't load GIFs. You can still attach a GIF file.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="btn-ghost px-2 py-1.5 text-xs font-bold" aria-label="GIF">
        GIF
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-ink-800">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Search GIFs…"
            className="input mb-2 py-1.5 text-sm"
          />
          {loading && <p className="py-4 text-center text-xs muted">Loading…</p>}
          {error && <p className="py-3 text-center text-xs text-amber-600">{error}</p>}
          <div className="grid max-h-56 grid-cols-3 gap-1 overflow-y-auto">
            {gifs.map((g, i) => (
              <button key={i} type="button" onClick={() => { onPick(g.url); setOpen(false); }} className="overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.preview} alt="GIF" className="h-20 w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <p className="mt-1 text-center text-[10px] muted">Powered by Tenor</p>
        </div>
      )}
    </div>
  );
}
