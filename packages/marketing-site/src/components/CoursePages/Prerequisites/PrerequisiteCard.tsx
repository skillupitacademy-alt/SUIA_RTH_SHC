'use client';

import React from 'react';
import { getReactIcon } from './reactIconsMapper';
import { PrerequisiteCard as PrerequisiteCardType } from '@quiz/marketing-site/lib/CoursesCardData';

interface PrerequisiteCardProps {
  card: PrerequisiteCardType;
}

export const PrerequisiteCard: React.FC<PrerequisiteCardProps> = ({ card }) => {
  const IconComponent = getReactIcon(card.icon);

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={card.id * 100}
      data-aos-duration="700"
      data-aos-once="false"
      className={`relative ${card.bgColor} rounded-2xl ${card.borderColor} p-8 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full`}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-4 bg-gradient-to-br ${card.gradient} rounded-xl shadow-lg`}>
          <IconComponent className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {card.title}
        </h2>
      </div>

      <div className="space-y-4 flex-grow">
        {card.items.map((item, index) => {
          const ItemIcon = getReactIcon(item.icon);
          
          return (
            <div 
              key={index} 
              className="flex items-center gap-4 p-3 bg-white/70 rounded-xl border border-gray-100"
            >
              <ItemIcon className={`w-6 h-6 ${item.iconColor || 'text-gray-600'}`} />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {item.title}
                </div>
                {item.subtitle && (
                  <div className="text-sm text-gray-600">
                    {item.subtitle}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};