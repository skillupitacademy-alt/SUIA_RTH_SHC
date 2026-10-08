'use client';

import React from 'react';
import Image from 'next/image';
import { renderLucideIcon } from './lucideIconsMapper';

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
  return (
    <div className={`rounded-2xl p-6 border-2 ${borderColor} ${bgColor}`}>
      <h3 className="md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        {renderLucideIcon(icon, "w-7 h-7")} {category}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-[12px] md:text-[17px]">
        {technologies.map((tech, idx) => {
          if (tech.iconSrc) {
            return (
              <div key={idx} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200">
                <Image src={tech.iconSrc} alt={tech.label} width={48} height={48} className="w-12 h-12 mb-2" />
                <span className="font-semibold text-gray-800 text-center">{tech.label}</span>
              </div>
            );
          } else if (tech.icon) {
            return (
              <div key={idx} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="mb-2">
                  {renderLucideIcon(tech.icon, "w-10 h-10 text-green-500")}
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
