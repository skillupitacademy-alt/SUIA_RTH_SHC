"use client";

import { useEffect, useState } from "react";

export const useSectionVisibility = (id: string, topThreshold = 0.2, bottomThreshold = 0.8) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = document.getElementById(id);
    if (!section) return;

    const checkVisibility = () => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const visible =
        rect.top <= windowHeight * bottomThreshold &&
        rect.bottom >= windowHeight * topThreshold;

      setIsVisible(visible);
    };


    let rafId: number;
    const loop = () => {
      checkVisibility();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [id, topThreshold, bottomThreshold]);

  return isVisible;
};
