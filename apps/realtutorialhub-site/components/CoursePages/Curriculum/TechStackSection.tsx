'use client';

import React from 'react';
import { getLucideIcon } from './lucideIconsMapper';

interface TechItem {
  label: string;
  iconSrc?: string;
  icon?: string;
}

interface TechStackSectionProps {
  category: string;
  icon: string;
  borderColor: string;
  bgColor: string;
  technologies: TechItem[];
}

export const TechStackSection: React.FC<TechStackSectionProps> = ({
  category,
  icon,
  borderColor,
  bgColor,
  technologies
}) => {
  const IconComponent = getLucideIcon(icon);

  return (
    <div className={`rounded-2xl p-6 border-2 ${borderColor} ${bgColor}`}>
      <h3 className="md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <IconComponent className="w-7 h-7" /> {category}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-[12px] md:text-[17px]">
        {technologies.map((tech, idx) => {
          if (tech.iconSrc) {
            return (
              <div key={idx} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200">
                <img src={tech.iconSrc} alt={tech.label} className="w-12 h-12 mb-2" />
                <span className="font-semibold text-gray-800 text-center">{tech.label}</span>
              </div>
            );
          } else if (tech.icon) {
            const TechIcon = getLucideIcon(tech.icon);
            return (
              <div key={idx} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="mb-2">
                  <TechIcon className="w-10 h-10 text-green-500" />
                </div>
                <span className="font-semibold text-gray-800 text-center">{tech.label}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};