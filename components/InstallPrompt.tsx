"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "install-prompt-dismissed-at";
const SNOOZE_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** A dismissible bottom banner nudging phone users to add the app to their home screen. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt && Date.now() - Number(dismissedAt) < SNOOZE_DAYS * 86_400_000) return;
    } catch {}

    if (isIOS()) {
      setIos(true);
      setShow(true);
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-3 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center gap-3 rounded-2xl bg-ink-900 p-3 text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Get the app on your phone</p>
          <p className="text-xs text-white/70">
            {ios ? (
              <>Tap <span className="font-medium text-white">Share</span> below, then <span className="font-medium text-white">Add to Home Screen</span>.</>
            ) : (
              "One tap install — full screen, faster, works like a real app."
            )}
          </p>
        </div>
        {!ios && (
          <button onClick={install} className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-ink-900">
            Install
          </button>
        )}
        <button onClick={dismiss} className="shrink-0 rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Dismiss">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
