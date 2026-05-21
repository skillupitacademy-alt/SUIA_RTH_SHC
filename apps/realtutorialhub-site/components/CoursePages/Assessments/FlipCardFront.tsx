'use client';

import React from 'react';
import { LucideIcon, RotateCw } from 'lucide-react';

interface FlipCardFrontProps {
  card: {
    id: number;
    title: string;
    icon: React.ReactNode;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    features: string[];
  };
}

export const FlipCardFront: React.FC<FlipCardFrontProps> = ({ card }) => {
  const getColorClass = (id: number, type: 'bg' | 'text' | 'dot') => {
    switch (id) {
      case 0: return type === 'bg' ? 'bg-blue-100' : type === 'text' ? 'text-blue-700' : 'bg-blue-500';
      case 1: return type === 'bg' ? 'bg-green-100' : type === 'text' ? 'text-green-700' : 'bg-green-500';
      case 2: return type === 'bg' ? 'bg-pink-100' : type === 'text' ? 'text-pink-700' : 'bg-pink-500';
      case 3: return type === 'bg' ? 'bg-amber-100' : type === 'text' ? 'text-amber-700' : 'bg-amber-500';
      default: return '';
    }
  };

  const getTypeLabel = (id: number) => {
    switch (id) {
      case 0: return 'Weekly';
      case 1: return 'Module';
      case 2: return 'Project';
      case 3: return 'Certification';
      default: return '';
    }
  };

  return (
    <div className={`absolute inset-0 backface-hidden ${card.bgColor} rounded-3xl shadow-2xl border-2 ${card.borderColor} overflow-hidden`}>
      <div className={`h-3 bg-gradient-to-r ${card.color}`}></div>
      <div className="p-10 h-full flex flex-col">
        {/* Icon and Badge */}
        <div className="flex items-start justify-between mb-8">
          <div className={`p-5 rounded-2xl bg-gradient-to-r ${card.color} text-white`}>
            {card.icon}
          </div>
          <div className={`px-4 py-2 rounded-full text-base font-semibold ${card.textColor} ${getColorClass(card.id, 'bg')}`}>
            {getTypeLabel(card.id)}
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {card.title}
          </h3>
          <p className="text-gray-600 text-md md:text-lg">
            {card.description}
          </p>
        </div>

        {/* Features List */}
        <div className="mb-8">
          <h4 className="font-semibold text-gray-700 mb-4 text-xl">
            Includes:
          </h4>
          <div className="space-y-3">
            {card.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getColorClass(card.id, 'dot')}`}></div>
                <span className="text-gray-700 text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flip Hint */}
        <div className="text-lg font-medium text-gray-600 absolute bottom-5 left-[50%] -translate-x-[50%] flex justify-center items-center gap-5">
          <RotateCw className="w-6 h-6" /> Tap to flip
        </div>
      </div>
    </div>
  );
};