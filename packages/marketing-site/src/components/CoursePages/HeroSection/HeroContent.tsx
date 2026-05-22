'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeroContentProps {
  title: string;
  subtitle?: string;
  description: string;
  subDescription?: string;
  badgeText: string;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  title,
  subtitle,
  description,
  subDescription,
  badgeText,
}) => (
  <>
    <div className="text-center mb-8">
      <div
        className="inline-flex items-center gap-2 px-6 py-3 backdrop-blur-md rounded-full border shadow-lg transition-all duration-300"
        style={{
          backgroundColor: "color-mix(in srgb, var(--brand-secondary) 25%, transparent)",
          borderColor: "color-mix(in srgb, var(--brand-secondary) 45%, transparent)"
        }}
      >
        <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
        <span className="text-white font-semibold">{badgeText}</span>
      </div>
    </div>

    <div className="text-center mb-6">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
        <span className="text-white drop-shadow-2xl leading-tight block mb-2">
          {title}
        </span>
        {subtitle && (
          <span
            className="drop-shadow-2xl inline-block animate-pulse border border-transparent pb-2"
            style={{ color: "var(--brand-secondary)" }}
          >
            {subtitle}
          </span>
        )}
      </h1>
    </div>

    <div className="text-center mb-8">
      <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-4">
        {description}
      </p>
      {subDescription && (
        <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
          {subDescription}
        </p>
      )}
    </div>
  </>
);
