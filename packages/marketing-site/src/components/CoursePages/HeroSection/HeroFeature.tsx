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
        className="flex items-center gap-2 px-5 py-3 bg-white shadow-md rounded-full border border-gray-100 hover:bg-gray-50 hover:border-[var(--brand-primary)] transition-all duration-300 hover:scale-105"
      >
        <feature.icon className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} />
        <span className="text-[var(--brand-primary)] font-medium text-sm">{feature.text}</span>
      </div>
    ))}
  </div>
);
