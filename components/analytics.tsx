"use client";

import { useEffect } from "react";

/**
 * Privacy-friendly product analytics (spec §2.2). Loads PostHog from CDN only
 * when NEXT_PUBLIC_POSTHOG_KEY is set — a no-op otherwise, so no analytics
 * dependency or network calls in development.
 */
export function Analytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || typeof window === "undefined") return;
    if ((window as unknown as { posthog?: unknown }).posthog) return;
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
    // Minimal PostHog snippet loader.
    const s = document.createElement("script");
    s.src = `${host}/static/array.js`;
    s.async = true;
    s.onload = () => {
      const ph = (window as unknown as { posthog?: { init?: (k: string, o: object) => void } }).posthog;
      ph?.init?.(key, { api_host: host, capture_pageview: true });
    };
    document.head.appendChild(s);
  }, []);
  return null;
}
