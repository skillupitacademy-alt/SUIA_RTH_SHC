"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useBrand } from "@quiz/marketing-site/brand";

import {
  HERO_SLIDES,
  PARTICLE_CONFIGS,
  ANIMATION_DURATION,
  AUTOPLAY_DELAY,
} from "@quiz/marketing-site/lib/HeroSectionData";

import { ArrowRight, Sparkles } from "./HeroIcons";
import { AnimatedParticle } from "./HeroParticles";
import { useAutoSlide } from "./useAutoSlider";
import HeroText from "./HeroText";
import { getLenis } from "../Providers/LenisProvider";

/* ---------------- Slide Indicator ---------------- */

interface SlideIndicatorProps {
  currentSlide: number;
  totalSlides: number;
  onSlideChange: (index: number) => void;
}

interface HeroSliderProps {
  onSlideChange?: (index: number) => void;
}

const SlideIndicator: React.FC<SlideIndicatorProps> = ({
  currentSlide,
  totalSlides,
  onSlideChange,
}) => (
  <div
    role="tablist"
    aria-label="Hero Slides"
    className="absolute bottom-2 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20"
  >
    {Array.from({ length: totalSlides }).map((_, index) => {
      const isActive = currentSlide === index;

      return (
        <button
          key={index}
          role="tab"
          aria-selected={isActive}
          aria-label={`Go to slide ${index + 1}`}
          tabIndex={isActive ? 0 : -1}
          onClick={() => onSlideChange(index)}
          className={`h-2 rounded-full transition-all duration-300 ${
            isActive
              ? "w-8 md:w-12 bg-white"
              : "w-2 bg-white/40 hover:bg-white/60"
          }`}
        />
      );
    })}
  </div>
);

/* ---------------- Hero Slider ---------------- */

export default function HeroSlider({ onSlideChange }: HeroSliderProps) {
  const brand = useBrand();
  const [hydrated, setHydrated] = useState(false);
  const [startSlider, setStartSlider] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const sliderEnabled = hydrated && startSlider;

  useEffect(() => {
    if (!hydrated) return;

    requestAnimationFrame(() => {
      requestIdleCallback(() => {
        setStartSlider(true);
      });
    });
  }, [hydrated]);

  const {
    index: current,
    isAnimating,
    goTo,
    setPaused,
  } = useAutoSlide(
    HERO_SLIDES.length,
    AUTOPLAY_DELAY,
    ANIMATION_DURATION,
    sliderEnabled,
  );

  const currentSlide = HERO_SLIDES[current];
  const gradientStart =
    currentSlide.accent === "orange" ? brand.colors.primary : brand.colors.secondary;
  const gradientEnd =
    currentSlide.accent === "orange" ? brand.colors.secondary : brand.colors.primary;

  useEffect(() => {
    onSlideChange?.(current);
  }, [current, onSlideChange]);

  /* ---------------- Render Helpers ---------------- */

  const renderParticles = () =>
    PARTICLE_CONFIGS.map((config, index) => (
      <AnimatedParticle key={index} {...config} />
    ));

  const renderBadge = () => (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-8 transition-all duration-700 ${
        isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}
      style={{ animation: "slideInLeft 0.8s ease-out 0.2s both" }}
    >
      <Sparkles className="text-white" />
      <span className="text-white text-sm font-medium">
        Limited Time Offer - Enroll Now!
      </span>
    </div>
  );

  const renderButtons = () => (
    <div
      className={`flex flex-col md:flex-row gap-4 transition-all duration-700 ${
        isAnimating ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
      }`}
    >
      <button
        onClick={() => {
          const lenis = getLenis();
          if (lenis) {
            lenis.scrollTo("#courses", {
              offset: 0,
              duration: 1.2,
            });
          } else {
            document
              .getElementById("courses")
              ?.scrollIntoView({ behavior: "smooth" });
          }
        }}
        className="group flex justify-center px-4 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2"
      >
        {currentSlide.btn1}
        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
      </button>

      <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white rounded-lg font-semibold text-lg hover:bg-white/20 hover:scale-105 transition-all">
        {currentSlide.btn2}
      </button>
    </div>
  );

  const renderDesktopImage = () => (
    <div className="w-full max-w-lg mx-auto">
      <div
        className={`relative w-full aspect-[3/4] transition-all duration-700 ${
          isAnimating ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
        }`}
        style={{ animation: "slideInDown 0.8s ease-out 0.3s both" }}
      >
        <Image
          src={currentSlide.image}
          alt={currentSlide.title}
          fill
          className="object-contain scale-110 md:scale-100"
          sizes="(max-width: 768px) 90vw"
          priority={current === 0}
        />
      </div>
    </div>
  );

  /* ---------------- JSX ---------------- */

  return (
    <section
      className="relative w-full h-screen overflow-hidden pt-8 md:pt-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* <HeroText /> */}

      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          transition: current === 0 ? "none" : "background 1s ease-in-out",
        }}
      >
        {startSlider && (
          <Suspense fallback={null}>{renderParticles()}</Suspense>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden relative h-full flex flex-col items-center justify-center px-6 mt-5 md:pt-16 lg:mt-0">
        {/* Mobile Image */}
        <div className="w-full max-w-lg">
          <div
            className={`relative w-full h-64 transition-all duration-700 ${
              isAnimating
                ? "opacity-0 translate-y-8"
                : "opacity-100 translate-y-0"
            }`}
            style={{ animation: "slideInDown 0.8s ease-out 0.3s both" }}
          >
            <Image
              src={currentSlide.image}
              alt={currentSlide.title}
              fill
              loading="lazy"
              fetchPriority="low"
              decoding="async"
              className="object-contain"
              sizes="50vw"
            />
          </div>
        </div>

        <HeroText index={current} />

        {/* Content */}
        <div className="w-full max-w-2xl text-center z-10">
          {renderButtons()}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex relative h-full items-center justify-between px-12 lg:px-24">
        <div className="max-w-2xl z-10">
          <HeroText index={current} />
          {startSlider && renderBadge()}
          {renderButtons()}
        </div>

        <div className="w-1/2 h-full flex items-center justify-end">
          {startSlider && renderDesktopImage()}
        </div>
      </div>

      {/* Indicator */}
      <SlideIndicator
        currentSlide={current}
        totalSlides={HERO_SLIDES.length}
        onSlideChange={goTo}
      />
    </section>
  );
}
