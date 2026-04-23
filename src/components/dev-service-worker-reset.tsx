"use client";

import { useEffect } from "react";

export default function DevServiceWorkerReset() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    let cancelled = false;

    const resetServiceWorkers = async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }

      if ("caches" in window) {
        const cacheKeys = await caches.keys();

        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      }
    };

    void resetServiceWorkers().catch(() => {
      if (!cancelled) {
        // Keep local development running even if browser cache cleanup fails.
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
