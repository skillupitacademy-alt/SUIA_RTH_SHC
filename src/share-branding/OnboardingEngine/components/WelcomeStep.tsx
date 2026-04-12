'use client';

import { useBrand } from '../context/BrandContext';

interface WelcomeStepProps {
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ onStart, onSkip }: WelcomeStepProps) {
  const brand = useBrand();

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-8">
      <div className="space-y-3">
        <h1 className="text-5xl font-bold text-slate-900">
          Welcome to {brand.name}!
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Start your personalized learning journey today. Set your first goal to begin.
        </p>
      </div>

      {/* Goal Cards */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-3xl mt-8">
        {/* Learn New Skills */}
        <div
          className="border-2 rounded-2xl p-8 bg-white transition-all cursor-pointer hover:shadow-xl"
          style={{
            borderColor: brand.primaryColor,
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
          }}
        >
          <div className="flex flex-col items-center space-y-4">
            {/* Illustration */}
            <div className="w-40 h-40 flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Person */}
                <circle cx="80" cy="50" r="18" fill={brand.primaryColor} opacity="0.2"/>
                <circle cx="80" cy="50" r="15" fill={brand.primaryColor}/>
                <path d="M60 90c0-11 9-20 20-20s20 9 20 20v20H60V90z" fill={brand.primaryColor}/>
                {/* Laptop */}
                <rect x="50" y="90" width="60" height="35" rx="2" fill="#64748b" opacity="0.2"/>
                <rect x="50" y="90" width="60" height="30" rx="2" fill="#e2e8f0"/>
                <rect x="55" y="95" width="50" height="20" fill="#cbd5e1"/>
                {/* Gears */}
                <circle cx="40" cy="40" r="8" fill={brand.primaryColor} opacity="0.6"/>
                <circle cx="120" cy="45" r="6" fill={brand.primaryColor} opacity="0.4"/>
                {/* Light bulb */}
                <circle cx="115" cy="30" r="10" fill="#fbbf24" opacity="0.8"/>
                <path d="M115 40v5" stroke="#fbbf24" strokeWidth="2"/>
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                Learn New Skills
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gain practical knowledge, master new tools, and advance your career path.
              </p>
            </div>
          </div>
        </div>

        {/* Crack Exams & Certifications */}
        <div
          className="border-2 rounded-2xl p-8 bg-white transition-all cursor-pointer hover:shadow-xl"
          style={{
            borderColor: '#e2e8f0'
          }}
        >
          <div className="flex flex-col items-center space-y-4">
            {/* Illustration */}
            <div className="w-40 h-40 flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Person celebrating */}
                <circle cx="80" cy="55" r="18" fill="#ea580c" opacity="0.2"/>
                <circle cx="80" cy="55" r="15" fill="#ea580c"/>
                <path d="M60 95c0-11 9-20 20-20s20 9 20 20v15H60V95z" fill="#ea580c"/>
                {/* Arms raised */}
                <path d="M55 85l-15-15" stroke="#ea580c" strokeWidth="4" strokeLinecap="round"/>
                <path d="M105 85l15-15" stroke="#ea580c" strokeWidth="4" strokeLinecap="round"/>
                {/* Books */}
                <rect x="65" y="115" width="12" height="18" fill="#64748b" opacity="0.3"/>
                <rect x="78" y="120" width="12" height="13" fill="#64748b" opacity="0.4"/>
                <rect x="91" y="117" width="12" height="16" fill="#64748b" opacity="0.35"/>
                {/* Trophy */}
                <path d="M75 125h20v8c0 5-4 9-10 9s-10-4-10-9v-8z" fill="#fbbf24"/>
                <rect x="82" y="133" width="6" height="8" fill="#fbbf24" opacity="0.7"/>
                <rect x="78" y="141" width="14" height="3" fill="#fbbf24"/>
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                Crack Exams & Certifications
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Prepare effectively with practice tests, structured courses, and expert guidance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 mt-12">
        <button
          onClick={onSkip}
          className="text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={onStart}
          className="px-8 py-3 rounded-xl font-semibold text-white text-lg shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Next: Create Profile
        </button>
      </div>
    </div>
  );
}
