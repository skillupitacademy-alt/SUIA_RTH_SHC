import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroActionCard() {
  const brand = useBrand();

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] p-8 shadow-lg"
      style={{ backgroundColor: brand.primaryColor }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-white/90" size={20} />
          <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">
            {brand.dashboardGreeting}
          </span>
        </div>

        <h2 className="text-3xl font-black text-white mb-2">
          Resume {brand.tutorLabel} Session
        </h2>
        <p className="text-white/90 text-lg mb-6">
          Continue your remediation for <span className="font-bold">Linked Lists & Trees</span>
        </p>

        <button className="px-8 h-14 rounded-2xl bg-white hover:bg-gray-50 transition-all flex items-center gap-3 font-bold text-lg shadow-md group">
          <span style={{ color: brand.primaryColor }}>Start Learning Now</span>
          <ArrowRight
            className="group-hover:translate-x-1 transition-transform"
            style={{ color: brand.primaryColor }}
            size={22}
          />
        </button>
      </div>
    </div>
  );
}