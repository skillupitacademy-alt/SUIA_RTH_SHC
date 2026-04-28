'use client';

import { useBrand } from '../context/BrandContext';
import { OnboardingStatusOption } from '../../onboardingPageData';

interface ProfileStepProps {
  title: string;
  subtitle: string;
  fullName: string;
  educationLevel: string;
  status: 'student' | 'professional';
  fullNameLabel: string;
  fullNamePlaceholder: string;
  educationLevelLabel: string;
  educationLevelPlaceholder: string;
  educationLevels: string[];
  statusLabel: string;
  statusOptions: OnboardingStatusOption[];
  onChange: (field: string, value: string) => void;
}

export function ProfileStep({
  title,
  subtitle,
  fullName,
  educationLevel,
  status,
  fullNameLabel,
  fullNamePlaceholder,
  educationLevelLabel,
  educationLevelPlaceholder,
  educationLevels,
  statusLabel,
  statusOptions,
  onChange
}: ProfileStepProps) {
  const brand = useBrand();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">{fullNameLabel}</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder={fullNamePlaceholder}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-current transition-colors"
            style={{
              borderColor: fullName ? brand.primaryColor : undefined
            }}
          />
        </div>

        {/* Education Level */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">{educationLevelLabel}</label>
          <select
            value={educationLevel}
            onChange={(e) => onChange('educationLevel', e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-current transition-colors appearance-none bg-white cursor-pointer"
            style={{
              borderColor: educationLevel ? brand.primaryColor : undefined
            }}
          >
            <option value="">{educationLevelPlaceholder}</option>
            {educationLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Status Toggle */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">{statusLabel}</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            {statusOptions.map((option) => {
              const isSelected = status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onChange('status', option.value)}
                  className={`flex-1 px-6 py-4 rounded-xl font-semibold border-2 transition-all ${
                    isSelected
                      ? 'text-white shadow-lg'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  style={{
                    backgroundColor: isSelected ? brand.primaryColor : undefined,
                    borderColor: isSelected ? brand.primaryColor : undefined
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
