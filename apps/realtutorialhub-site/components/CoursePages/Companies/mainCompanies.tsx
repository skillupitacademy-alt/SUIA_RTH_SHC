'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { CompaniesHeader } from './CompaniesHeader';
import { MarqueeContainer } from './MarqueeContainer';
import { CompaniesData } from '@/lib/CoursesCardData';

interface CompaniesProps {
  id: string; 
  data: CompaniesData;
}

export default function Companies({ id, data }: CompaniesProps) {
  useEffect(() => {
    AOS.init({
      duration: 700,
      once: true,
    });
  }, []);

  return (
    <section id={id} className="py-20 bg-transparent relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-52 h-52 bg-blue-100 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-40" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-orange-100 rounded-full translate-x-1/3 translate-y-1/3 opacity-40" />

      <div className="max-w-7xl mx-auto px-0 md:px-4 relative z-10">
        <CompaniesHeader 
          title={data.title} 
          description={data.description} 
        />

        <MarqueeContainer companies={data.companies} />
      </div>
    </section>
  );
}