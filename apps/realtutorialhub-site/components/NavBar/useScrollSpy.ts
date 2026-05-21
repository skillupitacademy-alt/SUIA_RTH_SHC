"use client";

import { useEffect, useState, useCallback } from "react";
import { NavItem } from "@/lib/NavBarData";

export function useScrollSpy(navItems: NavItem[]) {
  const [activeSection, setActiveSection] = useState(navItems[0]?.id ?? "");
  const [isScrolled, setIsScrolled] = useState(false);

  /* ---------- Simple scroll state (allowed) ---------- */
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- Intersection Observer (RT-203 safe) ---------- */
  useEffect(() => {
    if (!navItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [navItems]);

  /* ---------- Smooth scroll ---------- */
const scrollToSection = useCallback((id: string) => {
  const el = document.getElementById(id);
  console.log("SCROLL TARGET:", id, el);

  if (!el) {
    alert(`Section ${id} NOT FOUND`);
    return;
  }

  el.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, []);


  return {
    activeSection,
    isScrolled,
    scrollToSection,
  };
}
