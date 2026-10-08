'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { PlacementStatsHeader } from './PlacementStatsHeader';
import { MainStatCard } from './mainStatCard';
import { useCounterAnimation } from './useCounterAnimation';
import { PlacementStatisticsData } from '@/lib/CoursesCardData';

interface PlacementStatisticsProps {
  id: string;
  data: PlacementStatisticsData;
}

export default function PlacementStatistics({ id, data }: PlacementStatisticsProps) {
  const targetValues = data.mainStats.reduce((acc, stat) => ({
    ...acc,
    [stat.id]: stat.targetValue
  }), {});

  const { counters, sectionRef } = useCounterAnimation(targetValues);

  useEffect(() => {
    AOS.init({
      duration: 700,
      once: true,
    });
  }, []);

  return (
    <div 
    id={id}
      ref={sectionRef} 
      className="min-h-screen bg-transparent p-4 md:p-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <PlacementStatsHeader 
          title={data.title} 
          description={data.description} 
        />

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {data.mainStats.map((stat) => (
            <MainStatCard
              key={stat.id}
              stat={stat}
              currentValue={counters[stat.id] || 0}
            />
          ))}
        </div>

      </div>
    </div>
  );
}