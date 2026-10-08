'use client';

import React from 'react';
import { PlacementHeader } from './PlacementHeader';
import { PlacementCard } from './PlacementCard';
import { PlacementSupportData } from '@/lib/CoursesCardData';

interface PlacementSupportProps {
  id: string;
  data: PlacementSupportData;
}

export default function PlacementSupport({ id, data }: PlacementSupportProps) {
  // If useAOSInit doesn't exist, add AOS init here:
  // useEffect(() => {
  //   AOS.init({ duration: 700, once: true });
  // }, []);

  return (
    <div id={id} className="min-h-screen pt-10 bg-transparent p-4 md:p-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <PlacementHeader 
          title={data.title} 
          description={data.description} 
        />

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {data.services.map((service) => (
            <PlacementCard 
              key={service.id} 
              service={service} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
