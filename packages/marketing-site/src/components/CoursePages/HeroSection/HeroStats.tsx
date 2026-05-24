'use client';

import React from 'react';
import { HeroStat } from './types';

interface HeroStatsProps {
  stats: HeroStat[];
}

export const HeroStats: React.FC<HeroStatsProps> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
    {stats.map((stat, idx) => (
      <div
        key={idx}
        className="group relative bg-white rounded-3xl p-8 border border-gray-100 transition-all duration-300 hover:scale-105 hover:-translate-y-2 overflow-hidden shadow-xl hover:shadow-2xl"
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 mix-blend-overlay"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        <div
          className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 mix-blend-screen"
          style={{ backgroundColor: "var(--brand-secondary)" }}
        />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-4">
            <div
              className="p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg bg-gray-50 border border-gray-100"
            >
              <stat.icon className="w-8 h-8 text-[var(--brand-primary)]" />
            </div>
          </div>
          <div
            className="text-4xl md:text-5xl font-bold mb-2 text-center group-hover:scale-110 transition-transform duration-300 text-[var(--brand-primary)]"
          >
            {stat.value}
          </div>
          <div className="text-[var(--brand-secondary)] font-medium text-center font-semibold text-sm tracking-wide">
            {stat.label}
          </div>
        </div>
      </div>
    ))}
  </div>
);
