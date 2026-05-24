"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useBrand } from "@quiz/marketing-site/brand";
import {
  Code, Laptop, Rocket, Briefcase, Star, Zap,
  Users, Award, Trophy, ThumbsUp, Handshake,
  CalendarDays, Target, Building2, BadgeCheck, GraduationCap, TrendingUp,
  DollarSign, LineChart, Building, MapPin,
  Globe, Compass, BookOpen, Cpu, Sparkles,
  type LucideIcon
} from "lucide-react";

import {
  HERO_SLIDES,
  PARTICLE_CONFIGS,
  ANIMATION_DURATION,
  AUTOPLAY_DELAY,
} from "@quiz/marketing-site/lib/HeroSectionData";

import { ArrowRight } from "./HeroIcons";
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
              ? "w-8 md:w-12 bg-gray-800"
              : "w-2 bg-gray-300 hover:bg-gray-400"
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
  const heroBackground = "transparent";
  

  const ICON_MAP: Record<string, LucideIcon> = {
    Code, Laptop, Rocket, Briefcase, Star, Zap,
    Users, Award, Trophy, ThumbsUp, Handshake,
    CalendarDays, Target, Building2, BadgeCheck, GraduationCap, TrendingUp,
    DollarSign, LineChart, Building, MapPin,
    Globe, Compass, BookOpen, Cpu, Sparkles,
  };

  const renderSquareCards = () => {
    return (
      <div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-0 h-full content-between">
        {currentSlide.floatingIcons.map((item, idx) => {
          const Icon = ICON_MAP[item.icon];
          if (!Icon) return null;
          
          // ALGORITHM: Alternate primary and secondary color per card
          const cardColor = idx % 2 === 0 ? "var(--brand-primary)" : "var(--brand-secondary)";
          
          return (
            <div
              key={`${current}-${idx}`}
              className="flex flex-col items-center justify-center gap-3 w-28 h-28 rounded-2xl bg-white border border-gray-100 shadow-md transition-transform hover:scale-105"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${cardColor} 12%, white)` }}
              >
                <Icon style={{ color: cardColor, width: 24, height: 24 }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center px-1">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
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
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 mb-8 transition-all duration-700 ${
        isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}
      style={{ animation: "slideInLeft 0.8s ease-out 0.2s both" }}
    >
      <Sparkles style={{ color: "var(--brand-primary)" }} />
      <span className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>
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
        className="group flex justify-center px-4 py-4 rounded-lg font-semibold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-white"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        {currentSlide.btn1}
        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
      </button>

      <button className="px-8 py-4 bg-transparent border-2 rounded-lg font-semibold text-lg hover:bg-gray-50 hover:scale-105 transition-all" style={{ borderColor: "var(--brand-secondary)", color: "var(--brand-secondary)" }}>
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
          backgroundColor: heroBackground,
          transition: current === 0 ? "none" : "background-color 1s ease-in-out",
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
        <div className="max-w-2xl z-10 flex flex-col justify-center">
          <HeroText index={current} />
          {startSlider && renderBadge()}
          {renderButtons()}
        </div>

        <div className="w-1/2 h-full flex justify-end gap-8 py-24">
          <div className="flex-1 flex items-center h-full w-full">
            {startSlider && renderDesktopImage()}
          </div>
          {startSlider && renderSquareCards()}
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
