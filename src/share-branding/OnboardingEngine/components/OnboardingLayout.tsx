'use client';

import { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

import { useBrand } from '../context/BrandContext';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  steps: string[];
  footerText: string;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  showBack?: boolean;
  showContinue?: boolean;
  continueDisabled?: boolean;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  steps,
  footerText,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  showBack = true,
  showContinue = true,
  continueDisabled = false,
}: OnboardingLayoutProps) {
  const brand = useBrand();
  const visibleSteps = steps.slice(0, totalSteps);
  const activeStepLabel = visibleSteps[currentStep] ?? visibleSteps[0] ?? 'Step';
  const progressPercent =
    totalSteps > 0 ? Math.min(100, Math.max(0, ((currentStep + 1) / totalSteps) * 100)) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[800px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              <span style={{ color: brand.primaryColor }}>{brand.name.split(' ')[0]}</span>
              <span className="text-slate-900">
                {brand.name.substring(brand.name.split(' ')[0].length)}
              </span>
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 md:hidden">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Step {currentStep + 1} of {totalSteps}
                </p>
                <p className="text-sm font-semibold text-slate-900">{activeStepLabel}</p>
              </div>
              <div
                className="flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold text-white"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {currentStep + 1}
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%`, backgroundColor: brand.primaryColor }}
              />
            </div>
          </div>

          <div className="-mx-1 hidden overflow-x-auto pb-1 md:block">
            <div className="flex min-w-max items-center gap-3 px-1">
              {visibleSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                        index < currentStep || index === currentStep
                          ? 'text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                      style={{
                        backgroundColor: index <= currentStep ? brand.primaryColor : undefined,
                      }}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`whitespace-nowrap text-xs font-medium ${
                        index === currentStep ? 'opacity-100' : 'opacity-60'
                      }`}
                      style={{
                        color: index === currentStep ? brand.primaryColor : '#64748b',
                      }}
                    >
                      {step}
                    </span>
                  </div>
                  {index < visibleSteps.length - 1 && (
                    <div
                      className={`mb-6 h-0.5 w-12 transition-all ${
                        index < currentStep ? '' : 'bg-slate-200'
                      }`}
                      style={{
                        backgroundColor: index < currentStep ? brand.primaryColor : undefined,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[800px]">{children}</div>
      </main>

      <footer className="border-t border-slate-200 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[800px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Back
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {showContinue && onContinue && (
            <button
              onClick={onContinue}
              disabled={continueDisabled}
              className="w-full rounded-lg px-6 py-2.5 font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              style={{
                backgroundColor: brand.primaryColor,
                opacity: continueDisabled ? 0.5 : 1,
              }}
            >
              {continueLabel}
            </button>
          )}
        </div>
      </footer>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[800px] text-center text-sm text-slate-500">{footerText}</div>
      </div>
    </div>
  );
}
