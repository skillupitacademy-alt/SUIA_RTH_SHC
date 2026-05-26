'use client';

import React from 'react';
import { HeroFeature, HeroStat } from './types';

interface HeroFeaturesProps {
  features: HeroFeature[];
  stats?: HeroStat[];
}

export const HeroFeatures: React.FC<HeroFeaturesProps> = ({ features, stats = [] }) => (
  <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-[350px] mx-auto lg:mx-0">
    {features.map((feature, idx) => (
      <div
        key={`feature-${idx}`}
        className="flex flex-col items-center justify-center gap-4 w-40 aspect-square p-4 bg-white shadow-lg rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-[var(--brand-primary)] hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
      >
        <div className="p-3 rounded-xl bg-gray-50 shadow-sm border border-gray-100 mb-1">
          <feature.icon className="w-8 h-8" style={{ color: "var(--brand-secondary)" }} />
        </div>
        <span className="text-[var(--brand-primary)] font-bold text-sm leading-tight">{feature.text}</span>
      </div>
    ))}
    {stats.map((stat, idx) => (
      <div
        key={`stat-${idx}`}
        className="flex flex-col items-center justify-center gap-2 w-40 aspect-square p-4 bg-white shadow-lg rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-[var(--brand-primary)] hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
      >
        <span className="text-3xl font-bold" style={{ color: "var(--brand-secondary)" }}>
          {stat.value}
        </span>
        <span className="text-[var(--brand-primary)] font-bold text-sm leading-tight mt-1">{stat.label}</span>
      </div>
    ))}
  </div>
);
