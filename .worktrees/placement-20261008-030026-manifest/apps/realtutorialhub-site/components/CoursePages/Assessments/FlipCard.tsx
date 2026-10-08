'use client';

import React from 'react';
import { FlipCardFront } from './FlipCardFront';
import { FlipCardBack } from './FlipCardBack';

interface FlipCardProps {
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
    backContent: {
      points: string[];
      frequency: string;
      weightage: string;
    };
  };
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlipCard: React.FC<FlipCardProps> = ({ 
  card, 
  isFlipped, 
  onFlip 
}) => (
  <div
    key={card.id}
    data-aos="fade-up"
    data-aos-delay={card.id * 120}
    data-aos-duration="700"
    data-aos-once="true"
    className="relative h-[550px] cursor-pointer perspective-1000"
    onClick={onFlip}
  >
    <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
      <FlipCardFront card={card} />
      <FlipCardBack card={card} />
    </div>
  </div>
);