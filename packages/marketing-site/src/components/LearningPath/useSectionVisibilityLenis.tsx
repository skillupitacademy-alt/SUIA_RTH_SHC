"use client";
import { useState, useEffect, useRef } from "react";

export const useSectionVisibilityLenis = (
  id: string,
  // How many pixels BEFORE the section should button appear
  showOffset = 30,
  // How many pixels of visibility before hiding
  hideThreshold = 50
) => {
  const [isVisible, setIsVisible] = useState(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const checkVisibility = () => {
      const section = document.getElementById(id);
      if (!section) return false;

      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Section is approaching from above (but not yet fully in view)
      const isApproaching = rect.top <= showOffset && rect.top > -rect.height + hideThreshold;
      
      // Section is partially visible but not fully scrolled past
      const isPartiallyVisible = rect.top <= windowHeight - hideThreshold && rect.bottom >= hideThreshold;
      
      // Don't show if section is fully in viewport
      const isFullyInView = rect.top >= 0 && rect.bottom <= windowHeight;
      
      return (isApproaching || isPartiallyVisible) && !isFullyInView;
    };

    const handleScroll = () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        setIsVisible(checkVisibility());
      });
    };

    // Initial check
    setIsVisible(checkVisibility());

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [id, showOffset, hideThreshold]);

  return isVisible;
};