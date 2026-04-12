'use client';

import { ReactNode } from 'react';
import { useBrand } from '../context/BrandContext';
import { BookOpen } from 'lucide-react';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  showBack?: boolean;
  showContinue?: boolean;
  continueDisabled?: boolean;
}

const steps = ['Welcome', 'Profile', 'Goal', 'Domain', 'Skill Level'];

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  showBack = true,
  showContinue = true,
  continueDisabled = false
}: OnboardingLayoutProps) {
  const brand = useBrand();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              <span style={{ color: brand.primaryColor }}>{brand.name.split(' ')[0]}</span>
              <span className="text-slate-900">{brand.name.substring(brand.name.split(' ')[0].length)}</span>
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      index < currentStep
                        ? 'text-white'
                        : index === currentStep
                        ? 'text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                    style={{
                      backgroundColor: index <= currentStep ? brand.primaryColor : undefined
                    }}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      index === currentStep ? 'opacity-100' : 'opacity-60'
                    }`}
                    style={{
                      color: index === currentStep ? brand.primaryColor : '#64748b'
                    }}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mb-6 transition-all ${
                      index < currentStep ? '' : 'bg-slate-200'
                    }`}
                    style={{
                      backgroundColor: index < currentStep ? brand.primaryColor : undefined
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[800px]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-4">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {showContinue && onContinue && (
            <button
              onClick={onContinue}
              disabled={continueDisabled}
              className="px-6 py-2.5 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              style={{
                backgroundColor: brand.primaryColor,
                opacity: continueDisabled ? 0.5 : 1
              }}
            >
              {continueLabel}
            </button>
          )}
        </div>
      </footer>

      {/* Footer Links */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[800px] mx-auto text-center text-sm text-slate-500">
          {brand.name} © 2024 • Privacy Policy • Terms
        </div>
      </div>
    </div>
  );
}
