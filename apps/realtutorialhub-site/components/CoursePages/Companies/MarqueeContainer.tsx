'use client';

import React from 'react';
import { CompanyCard } from './CompanyCard';
import { Company } from '@/lib/CoursesCardData';

interface MarqueeContainerProps {
  companies: Company[];
}

export const MarqueeContainer: React.FC<MarqueeContainerProps> = ({ companies }) => {
  const duplicatedCompanies = [...companies, ...companies];

  return (
    <div
      data-aos="fade-up"
      data-aos-delay="200"
      data-aos-duration="700"
      className="relative"
    >
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 to-transparent z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent z-20" />

      <div className="overflow-hidden p-5">
        <div className="flex animate-marquee whitespace-nowrap py-8">
          {duplicatedCompanies.map((company, index) => (
            <div
              key={`${company.name}-${index}`}
              className="inline-flex items-center justify-center px-4"
            >
              <CompanyCard company={company} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 10s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          .animate-marquee {
            animation: marquee 10s linear infinite;
          }
        }
      `}</style>
    </div>
  );
};