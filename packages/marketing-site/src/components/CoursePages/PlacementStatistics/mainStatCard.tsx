'use client';

import React from 'react';
import { getPlacementIcon } from './iconMapper';
import { formatStatValue } from './formatters';
import { PlacementStatCard } from '@quiz/marketing-site/lib/CoursesCardData';

interface MainStatCardProps {
  stat: PlacementStatCard;
  currentValue: number;
}

export const MainStatCard: React.FC<MainStatCardProps> = ({ 
  stat, 
  currentValue 
}) => {
  const IconComponent = getPlacementIcon(stat.icon);

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={stat.id * 120}
      data-aos-duration="700"
      data-aos-once="true"
      className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
          <IconComponent className="w-8 h-8" />
        </div>
        <div className="text-right">
          <div className="text-4xl md:text-5xl font-bold text-gray-900">
            {formatStatValue(
              currentValue, 
              stat.format, 
              stat.decimalPlaces
            )}
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {stat.title}
      </h3>

      <p className="text-gray-600">
        {stat.description}
      </p>
    </div>
  );
};