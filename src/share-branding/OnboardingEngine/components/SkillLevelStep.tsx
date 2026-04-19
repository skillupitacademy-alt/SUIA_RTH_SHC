'use client';

import { useBrand } from '@/share-branding/OnboardingEngine/context/BrandContext';
import { OnboardingSkillLevelOption } from '@/share-branding/onboardingPageData';

interface SkillLevelStepProps {
  title: string;
  subtitle: string;
  skillLevelLabel: string;
  timeCommitmentLabel: string;
  levels: OnboardingSkillLevelOption[];
  timeCommitments: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | '';
  timeCommitment: string;
  onChange: (field: string, value: string) => void;
}

export function SkillLevelStep({
  title,
  subtitle,
  skillLevelLabel,
  timeCommitmentLabel,
  levels,
  timeCommitments,
  skillLevel,
  timeCommitment,
  onChange
}: SkillLevelStepProps) {
  const brand = useBrand();

  return (
    <div className="space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>

      {/* Skill Level */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-700">{skillLevelLabel}</h2>
        <div className="space-y-3">
          {levels.map((level) => {
            const isSelected = skillLevel === level.id;
            return (
              <button
                key={level.id}
                onClick={() => onChange('skillLevel', level.id)}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                  isSelected ? 'shadow-lg' : 'hover:border-slate-300'
                }`}
                style={{
                  borderColor: isSelected ? brand.primaryColor : '#e2e8f0',
                  backgroundColor: isSelected ? brand.accentBackground : '#ffffff'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-lg">
                      {level.title}
                    </div>
                    <div className="text-sm text-slate-600">
                      {level.description}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-0' : ''
                    }`}
                    style={{
                      borderColor: isSelected ? brand.primaryColor : '#cbd5e1',
                      backgroundColor: isSelected ? brand.primaryColor : 'transparent'
                    }}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Commitment */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-700">{timeCommitmentLabel}</h2>
        <div className="flex gap-3 flex-wrap">
          {timeCommitments.map((time) => {
            const isSelected = timeCommitment === time;
            return (
              <button
                key={time}
                onClick={() => onChange('timeCommitment', time)}
                className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all ${
                  isSelected
                    ? 'text-white shadow-lg'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                style={{
                  backgroundColor: isSelected ? brand.primaryColor : undefined,
                  borderColor: isSelected ? brand.primaryColor : undefined
                }}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
