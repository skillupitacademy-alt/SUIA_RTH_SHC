'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { PrerequisitesHeader } from './PrerequisitesHeader';
import { PrerequisiteCard } from './PrerequisiteCard';
import { PrerequisitesData } from '@quiz/marketing-site/lib/CoursesCardData';

interface PrerequisitesProps {
  id: string;
  data: PrerequisitesData;
}

export default function Prerequisites({ id, data }: PrerequisitesProps) {
  useEffect(() => {
    AOS.init({
      duration: 700,
      once: true,
    });
  }, []);

  return (
    <div id={id} className="min-h-screen bg-transparent py-16 px-4 overflow-hidden">
      <div 
        className="max-w-7xl mx-auto"
        data-aos="fade-up"
        data-aos-duration="700"
        data-aos-once="false"
      >
        <PrerequisitesHeader 
          title={data.title} 
          description={data.description} 
        />

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {data.cards.map((card) => (
            <PrerequisiteCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}