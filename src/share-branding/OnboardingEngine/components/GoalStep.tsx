'use client';

import { useBrand } from '@/share-branding/OnboardingEngine/context/BrandContext';
import { BookOpen, Award, Briefcase, TrendingUp, Check } from 'lucide-react';
import { GoalCard } from '@/share-branding/OnboardingEngine/models/onboardingSession';

interface GoalStepProps {
  title: string;
  subtitle: string;
  cards: GoalCard[];
  selectedGoal: string;
  onChange: (goalId: string) => void;
}

const iconMap = {
  BookOpen,
  Award,
  Briefcase,
  TrendingUp
};

export function GoalStep({ title, subtitle, cards, selectedGoal, onChange }: GoalStepProps) {
  const brand = useBrand();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>

      {/* Goal Grid */}
      <div className="grid max-w-4xl grid-cols-1 gap-6 mx-auto md:grid-cols-2">
        {cards.map((goal) => {
          const Icon = iconMap[goal.icon as keyof typeof iconMap];
          const isSelected = selectedGoal === goal.id;

          return (
            <button
              key={goal.id}
              onClick={() => onChange(goal.id)}
              className={`relative p-8 rounded-2xl border-2 transition-all text-left hover:shadow-lg ${
                isSelected ? 'shadow-xl' : ''
              }`}
              style={{
                borderColor: isSelected ? brand.primaryColor : '#e2e8f0',
                backgroundColor: isSelected ? brand.accentBackground : '#ffffff'
              }}
            >
              {/* Checkmark */}
              {isSelected && (
                <div
                  className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}

              <div className="space-y-4">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? brand.primaryColor : brand.accentBackground
                  }}
                >
                  <Icon
                    className="w-7 h-7"
                    style={{ color: isSelected ? '#ffffff' : brand.primaryColor }}
                    strokeWidth={2}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {goal.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {goal.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
