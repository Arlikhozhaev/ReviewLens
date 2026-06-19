"use client";

import { useEffect, useState } from "react";

/**
 * Mirrors the OS-level "reduce motion" setting. Components use this to
 * skip timed/staged animations entirely — jumping to the end state rather
 * than forcing a user through motion they've explicitly opted out of.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}