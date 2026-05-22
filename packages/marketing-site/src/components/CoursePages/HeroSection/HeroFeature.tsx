'use client';

import React from 'react';
import { HeroFeature } from './types';

interface HeroFeaturesProps {
  features: HeroFeature[];
}

export const HeroFeatures: React.FC<HeroFeaturesProps> = ({ features }) => (
  <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
    {features.map((feature, idx) => (
      <div
        key={idx}
        className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
      >
        <feature.icon className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} />
        <span className="text-white/90 font-medium text-sm">{feature.text}</span>
      </div>
    ))}
  </div>
);
