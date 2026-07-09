import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { logSession } from "@/lib/study.functions";

const IDLE_MS = 10 * 60 * 1000; // 10 min idle ends a session
const MIN_MS = 2 * 60 * 1000; // sessions under 2 min are ignored

/**
 * Chat study-time auto tracker.
 * Call `ping()` on each user send. A session opens on the first ping and closes
 * after 10 min of inactivity, on tab-hide, or on unload. Sessions shorter than
 * 2 min are dropped.
 */
export function useStudyTracker(kind: string = "chat") {
  const log = useServerFn(logSession);
  const startRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flush() {
    const start = startRef.current;
    if (!start) return;
    const end = lastRef.current || Date.now();
    startRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const minutes = Math.round((end - start) / 60000);
    if (end - start >= MIN_MS && minutes >= 1) {
      // fire and forget
      log({ data: { duration_min: Math.min(minutes, 600), kind } }).catch(() => {});
    }
  }

  function ping() {
    const now = Date.now();
    if (!startRef.current) startRef.current = now;
    lastRef.current = now;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flush(), IDLE_MS);
  }

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onUnload = () => flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ping };
}
