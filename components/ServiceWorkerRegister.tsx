"use client";

import { useEffect } from "react";

// Registers the service worker so the app is installable as a PWA.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    // When a new service worker takes over a tab that's been open since
    // before the update, its stale in-memory JS can end up talking to a
    // mismatched cache. Reload once so it picks up the new build cleanly
    // instead of erroring randomly.
    let reloaded = false;
    function onMessage(e: MessageEvent) {
      if (e.data === "sw-updated" && !reloaded) {
        reloaded = true;
        window.location.reload();
      }
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
  return null;
}
