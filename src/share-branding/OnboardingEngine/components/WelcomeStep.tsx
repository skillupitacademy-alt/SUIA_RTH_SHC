'use client';

import { useBrand } from '../context/BrandContext';
import { OnboardingWelcomeCard } from '../../onboardingPageData';

interface WelcomeStepProps {
  title: string;
  subtitle: string;
  cards: OnboardingWelcomeCard[];
  skipLabel: string;
  nextLabel: string;
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeStep({
  title,
  subtitle,
  cards,
  skipLabel,
  nextLabel,
  onStart,
  onSkip,
}: WelcomeStepProps) {
  const brand = useBrand();

  return (
    <div className="flex flex-col items-center space-y-8 py-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">{title}</h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">{subtitle}</p>
      </div>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        {cards.map((card, index) => {
          const isPrimary = card.emphasized || index === 0;
          return (
            <div
              key={card.title}
              className="cursor-pointer rounded-2xl border-2 bg-white p-6 transition-all hover:shadow-xl sm:p-8"
              style={{
                borderColor: isPrimary ? brand.primaryColor : '#e2e8f0',
                boxShadow: isPrimary ? '0 4px 20px -5px rgba(0,0,0,0.1)' : undefined,
              }}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40">
                  {card.illustration === 'learn' ? (
                    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="80" cy="50" r="18" fill={brand.primaryColor} opacity="0.2" />
                      <circle cx="80" cy="50" r="15" fill={brand.primaryColor} />
                      <path d="M60 90c0-11 9-20 20-20s20 9 20 20v20H60V90z" fill={brand.primaryColor} />
                      <rect x="50" y="90" width="60" height="35" rx="2" fill="#64748b" opacity="0.2" />
                      <rect x="50" y="90" width="60" height="30" rx="2" fill="#e2e8f0" />
                      <rect x="55" y="95" width="50" height="20" fill="#cbd5e1" />
                      <circle cx="40" cy="40" r="8" fill={brand.primaryColor} opacity="0.6" />
                      <circle cx="120" cy="45" r="6" fill={brand.primaryColor} opacity="0.4" />
                      <circle cx="115" cy="30" r="10" fill="#fbbf24" opacity="0.8" />
                      <path d="M115 40v5" stroke="#fbbf24" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="80" cy="55" r="18" fill="#ea580c" opacity="0.2" />
                      <circle cx="80" cy="55" r="15" fill="#ea580c" />
                      <path d="M60 95c0-11 9-20 20-20s20 9 20 20v15H60V95z" fill="#ea580c" />
                      <path d="M55 85l-15-15" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
                      <path d="M105 85l15-15" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
                      <rect x="65" y="115" width="12" height="18" fill="#64748b" opacity="0.3" />
                      <rect x="78" y="120" width="12" height="13" fill="#64748b" opacity="0.4" />
                      <rect x="91" y="117" width="12" height="16" fill="#64748b" opacity="0.35" />
                      <path d="M75 125h20v8c0 5-4 9-10 9s-10-4-10-9v-8z" fill="#fbbf24" />
                      <rect x="82" y="133" width="6" height="8" fill="#fbbf24" opacity="0.7" />
                      <rect x="78" y="141" width="14" height="3" fill="#fbbf24" />
                    </svg>
                  )}
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-600">{card.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex w-full max-w-md flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        <button
          onClick={onSkip}
          className="font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          {skipLabel}
        </button>
        <button
          onClick={onStart}
          className="w-full rounded-xl px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl sm:w-auto"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
