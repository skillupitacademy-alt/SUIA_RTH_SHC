import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface UseCaseCard {
  id: string;
  title: string;
  description: string;
  category: 'everyday' | 'career';
  icon: string;
}

interface LaymanUseCaseGridProps {
  gridTitle: string;
  useCaseCards: UseCaseCard[];
}

/**
 * Layman Use Case Grid Component
 * Renderer: use_case_grid
 * Layout Template: responsive_grid
 * Purpose: Practical beginner use-case examples
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function LaymanUseCaseGrid({ gridTitle, useCaseCards }: LaymanUseCaseGridProps) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Box;
    return IconComponent;
  };

  return (
    <div className="w-full mb-8">
      {/* Grid Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{gridTitle}</h2>

      {/* 4-Column Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {useCaseCards.map((card) => {
          const IconComponent = getIcon(card.icon);
          const isEveryday = card.category === 'everyday';

          return (
            <div
              key={card.id}
              className={`rounded-xl p-5 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer ${
                isEveryday
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-indigo-50 border-indigo-200'
              }`}
            >
              {/* Icon */}
              <div className="mb-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isEveryday ? 'bg-amber-100' : 'bg-indigo-100'
                  }`}
                >
                  <IconComponent
                    size={20}
                    className={isEveryday ? 'text-amber-600' : 'text-indigo-600'}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-slate-950 mb-2">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-xs font-medium text-slate-700 leading-relaxed mb-3">
                {card.description}
              </p>

              {/* Category Badge */}
              <span
                className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  isEveryday
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-indigo-200 text-indigo-900'
                }`}
              >
                {card.category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
