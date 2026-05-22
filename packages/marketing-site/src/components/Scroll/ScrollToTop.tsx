"use client";

import { useEffect, useState } from "react";

interface ScrollToTopProps {
  showThreshold?: number;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  size?: string;
  /**
   * @deprecated Kept for API compatibility. The button now uses brand primary.
   */
  gradient?: string;
  icon?: string;
  zIndex?: number;
  hideWhenMobileFilterOpen?: boolean; // New prop
}

export default function ScrollToTop({
  showThreshold = 300,
  position = "bottom-right",
  size = "w-12 h-12",
  gradient = "",
  icon = "↑",
  zIndex = 9999,
  hideWhenMobileFilterOpen = false,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Listen for mobile filter state
  useEffect(() => {
    const checkMobileFilter = () => {
      const mobileFilterPanel = document.getElementById('mobile-filter-panel');
      setMobileFilterOpen(mobileFilterPanel?.style.display !== 'none');
    };

    // Check periodically
    const interval = setInterval(checkMobileFilter, 100);
    return () => clearInterval(interval);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "bottom-6 left-6";
      case "top-right":
        return "top-6 right-6";
      case "top-left":
        return "top-6 left-6";
      case "bottom-right":
      default:
        return "bottom-6 right-6";
    }
  };

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > showThreshold);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [showThreshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Don't show if hidden or mobile filter is open
  if (!visible || (hideWhenMobileFilterOpen && mobileFilterOpen)) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`
        fixed ${getPositionClasses()} z-[${zIndex}]
        ${size} rounded-full ${gradient}
        text-white text-xl font-bold
        shadow-xl hover:shadow-2xl
        flex items-center justify-center
        transition-all duration-300
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-2
      `}
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      {icon}
    </button>
  );
}
