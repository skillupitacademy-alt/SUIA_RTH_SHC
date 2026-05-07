import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface ComponentCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  subcomponents: string[];
}

interface NotesComponentGridProps {
  gridTitle: string;
  componentCards: ComponentCard[];
}

/**
 * Component Grid Component
 * Renderer: component_grid
 * Layout Template: structured_breakdown
 * Purpose: Grid-based breakdown of subcomponents
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function NotesComponentGrid({ gridTitle, componentCards }: NotesComponentGridProps) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Box;
    return IconComponent;
  };

  return (
    <div className="w-full mb-8">
      {/* Grid Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{gridTitle}</h2>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {componentCards.map((card) => {
          const IconComponent = getIcon(card.icon);
          
          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
            >
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${brand.primaryColor}15` }}
              >
                <IconComponent 
                  size={24} 
                  style={{ color: brand.primaryColor }}
                  aria-hidden="true"
                />
              </div>

              {/* Card Title */}
              <h3 className="text-xl font-bold text-slate-950 mb-3">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">
                {card.description}
              </p>

              {/* Subcomponents */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Includes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.subcomponents.map((sub, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium border"
                      style={{ 
                        backgroundColor: `${brand.primaryColor}08`,
                        borderColor: `${brand.primaryColor}30`,
                        color: brand.primaryColorDark
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
