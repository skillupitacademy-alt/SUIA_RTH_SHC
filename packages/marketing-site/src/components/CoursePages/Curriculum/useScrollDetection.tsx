'use client';

import { useEffect } from 'react';

export const useScrollDetection = (setShowMobileButton: (show: boolean) => void) => {
  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById("CourseCurriculum");
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const isInViewport = rect.top <= window.innerHeight * 0.8 && rect.bottom >= window.innerHeight * 0.2;

      setShowMobileButton(isInViewport);
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setShowMobileButton]);
};