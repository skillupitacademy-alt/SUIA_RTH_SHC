"use client";

import { useEffect, useRef } from "react";

interface ScrollProgressBarProps {
  height?: string;
  gradient?: string;
  zIndex?: number;
}

export default function ScrollProgressBar({
  height = "h-[4px]",
  gradient = "bg-gradient-to-r from-blue-500 via-red-400 to-orange-600",
  zIndex = 10000,
}: ScrollProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const progress = docHeight ? scrollTop / docHeight : 0;

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }

      rafId.current = requestAnimationFrame(updateProgress);
    };

    rafId.current = requestAnimationFrame(updateProgress);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 w-full ${height} bg-transparent`}
      style={{ zIndex }}
      aria-hidden
    >
      <div
        ref={barRef}
        className={`h-full ${gradient}`}
        style={{
          transformOrigin: "left center",
          transform: "scaleX(0)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
