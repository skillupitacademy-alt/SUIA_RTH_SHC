'use client';

import React from 'react';
import { formatCounterValue, getCardColor } from './counterUtils';

interface GradingCardProps {
  card: {
    id: number;
    title: string;
    description: string;
    targetValue: number;
    format: 'percentage' | 'fixed';
    decimalPlaces?: number;
  };
  currentValue: number;
}

export const GradingCard: React.FC<GradingCardProps> = ({ 
  card, 
  currentValue 
}) => {
  const colorClass = getCardColor(card.id);

  return (
    <div
      key={card.id}
      data-aos="fade-up"
      data-aos-delay={card.id * 120}
      data-aos-duration="700"
      data-aos-once="false"
      className="rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center text-center min-h-[280px] bg-white hover:shadow-lg transition-all duration-300"
    >
      {/* Large Percentage Number */}
      <div className="mb-6">
        <div className={`text-6xl md:text-7xl font-bold mb-2 ${colorClass}`}>
          {formatCounterValue(
            currentValue, 
            card.format, 
            card.decimalPlaces
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {card.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        {card.description}
      </p>
    </div>
  );
};