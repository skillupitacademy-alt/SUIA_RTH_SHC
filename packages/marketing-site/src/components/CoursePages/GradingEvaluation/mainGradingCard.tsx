'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { GradingHeader } from './GradingHeader';
import { GradingCard } from './GradingCard';
import { useCounterAnimation } from './useCounterAnimation';
import { GradingEvaluationData } from '@quiz/marketing-site/lib/CoursesCardData';

interface GradingEvaluationProps {
  id: string;
  data: GradingEvaluationData;
}

export default function GradingEvaluation({ id, data }: GradingEvaluationProps) {
  const targetValues = data.cards.reduce((acc, card) => ({
    ...acc,
    [card.id]: card.targetValue
  }), {});

  const { counters, sectionRef } = useCounterAnimation(targetValues);

  useEffect(() => {
    AOS.init({
      duration: 700,
      once: true,
    });
  }, []);

  return (
    <div id={id} ref={sectionRef} className="min-h-screen bg-transparent p-4 md:p-8 flex items-center justify-center overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <GradingHeader title={data.title} />

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.cards.map((card) => (
            <GradingCard
              key={card.id}
              card={card}
              currentValue={counters[card.id] || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}