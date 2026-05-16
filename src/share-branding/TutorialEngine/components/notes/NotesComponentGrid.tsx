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
 */
export function NotesComponentGrid({ gridTitle, componentCards }: NotesComponentGridProps) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Box;
    return IconComponent;
  };

  return (
    <div className="w-full space-y-8">
      {/* Grid Title */}
      <div className="flex items-center gap-3">
         <div className="h-6 w-1 bg-indigo-500 rounded-full" />
         <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{gridTitle}</h3>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {componentCards.map((card) => {
          const IconComponent = getIcon(card.icon);
          
          return (
            <div
              key={card.id}
              className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-100"
            >
              {/* Background Glow */}
              <div 
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity group-hover:opacity-10"
                style={{ backgroundColor: brand.primaryColor }}
              />

              {/* Icon Container */}
              <div 
                className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${brand.primaryColor}10` }}
              >
                <IconComponent 
                  size={28} 
                  style={{ color: brand.primaryColor }}
                  aria-hidden="true"
                />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-slate-900">
                  {card.title}
                </h4>
                <p className="text-[14px] font-medium leading-relaxed text-slate-500 line-clamp-3">
                  {card.description}
                </p>

                {/* Sub-tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {card.subcomponents.map((sub, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-500 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors"
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
