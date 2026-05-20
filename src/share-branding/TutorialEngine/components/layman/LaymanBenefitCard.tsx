import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface BenefitCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  type?: string;
}

interface LaymanBenefitCardProps {
  sectionTitle: string;
  benefitCards: BenefitCard[];
}

/**
 * Layman Benefit Card Component
 * Renderer: benefit_card
 * Layout Template: benefit_grid
 * Purpose: Benefits, motivation, and value explanation grid
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function LaymanBenefitCard({ sectionTitle, benefitCards }: LaymanBenefitCardProps) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Star;
    return IconComponent;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'career':
        return { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' };
      case 'practical':
        return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' };
      case 'future':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-600' };
    }
  };

  return (
    <div className="w-full mb-8">
      {/* Section Title */}
      <h3 className="text-2xl font-bold text-slate-950 mb-6">{sectionTitle}</h3>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefitCards.map((card) => {
          const IconComponent = getIcon(card.icon);
          const colors = getTypeColor(card.type || 'practical');

          return (
            <div
              key={card.id}
              className={`${colors.bg} rounded-2xl p-6 border ${colors.border} shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer`}
            >
              {/* Icon */}
              <div className="mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm"
                >
                  <IconComponent
                    size={24}
                    className={colors.icon}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-950 mb-3">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {card.description}
              </p>

              {/* Type Badge */}
              <div className="mt-4">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/60">
                  {card.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
