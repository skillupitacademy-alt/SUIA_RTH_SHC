'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { InstructorsHeader } from './InstructorsHeaders';
import { MentorCard } from './MentorCard';
import { InstructorsMentorsData } from '@/lib/CoursesCardData';

interface InstructorsMentorsProps {
  id: string;
  data: InstructorsMentorsData;
}

export default function InstructorsMentors({ id, data }: InstructorsMentorsProps) {
  useEffect(() => {
    AOS.init({
      duration: 700,
      once: true,
    });
  }, []);

  return (
    <div id={id} className="min-h-screen bg-transparent py-16 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <InstructorsHeader 
          title={data.title} 
          description={data.description} 
        />

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {data.mentors.map((mentor, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 120}
              data-aos-duration="700"
              data-aos-once="false"
            >
              <MentorCard mentor={mentor} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}