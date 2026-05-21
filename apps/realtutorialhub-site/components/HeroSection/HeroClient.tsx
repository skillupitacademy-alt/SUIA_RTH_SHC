"use client";

import { ReactNode, useEffect, useState } from "react";
import HeroSlider from "./HeroSlider";
import HeroSliderSkeleton from "./HeroSliderSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HERO_SLIDES } from "@/lib/HeroSectionData";

export default function HeroClient({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      id="hero"
      className="relative h-screen overflow-hidden"
    >


      {/* ✅ HERO VISUALS */}
      <ErrorBoundary fallback={<HeroSliderSkeleton />}>
        <HeroSlider onSlideChange={setCurrent} />
      </ErrorBoundary>
    </section>
  );
}
