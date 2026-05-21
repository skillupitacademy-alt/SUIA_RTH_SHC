'use client';

import React from 'react';

interface FlipCardBackProps {
  card: {
    id: number;
    title: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    backContent: {
      points: string[];
    };
  };
}

export const FlipCardBack: React.FC<FlipCardBackProps> = ({ card }) => {
  const getColorClass = (id: number) => {
    switch (id) {
      case 0: return 'bg-blue-500';
      case 1: return 'bg-green-500';
      case 2: return 'bg-pink-500';
      case 3: return 'bg-amber-500';
      default: return '';
    }
  };

  return (
    <div className={`absolute inset-0 backface-hidden rotate-y-180 ${card.bgColor} rounded-3xl shadow-2xl border-2 ${card.borderColor} overflow-hidden`}>
      <div className={`h-3 bg-gradient-to-r ${card.color}`}></div>
      <div className="p-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            {card.title}
          </h3>
          <div className={`p-4 rounded-xl bg-gradient-to-r ${card.color} text-white`}>
            {card.icon}
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-8">
          <h4 className="font-semibold text-gray-700 mb-4 text-xl">Key Features:</h4>
          <ul className="space-y-4">
            {card.backContent.points.map((point, index) => (
              <li key={index} className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getColorClass(card.id)}`}></div>
                <span className="text-gray-600 md:text-lg">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};