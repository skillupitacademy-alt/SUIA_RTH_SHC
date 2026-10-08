"use client";

import HeroSlider from "./HeroSlider";
import HeroSliderSkeleton from "./HeroSliderSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function HeroClient() {
  return (
    <section id="hero" className="relative h-screen overflow-hidden">
      <ErrorBoundary fallback={<HeroSliderSkeleton />}>
        <HeroSlider />
      </ErrorBoundary>
    </section>
  );
}
