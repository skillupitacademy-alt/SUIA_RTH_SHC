'use client';

import { useState } from 'react';

export const useFlipCards = () => {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const toggleFlip = (index: number) => {
    setFlippedCards(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const isFlipped = (index: number) => flippedCards.includes(index);

  return {
    flippedCards,
    toggleFlip,
    isFlipped
  };
};