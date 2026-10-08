'use client';

import React from 'react';
import { CTAButtons } from './types';

interface HeroCTAProps {
  buttons: CTAButtons;
}

export const HeroCTA: React.FC<HeroCTAProps> = () => (
  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
    {/* <button className="group relative px-10 py-5 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-orange-500/60 transition-all duration-300 hover:scale-110 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="relative z-10 flex items-center gap-2">
        {buttons.primary}
        <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
      </span>
    </button>
    <button className="group px-10 py-5 bg-white/10 backdrop-blur-md text-white rounded-2xl font-bold text-lg border-2 border-white/40 hover:bg-white/20 hover:border-white/60 transition-all duration-300 hover:scale-105 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="relative z-10">{buttons.secondary}</span>
    </button> */}
  </div>
);
