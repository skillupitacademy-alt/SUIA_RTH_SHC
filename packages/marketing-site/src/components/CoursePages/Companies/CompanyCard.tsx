'use client';

import React from 'react';
import Image from 'next/image';
import { Company } from '@quiz/marketing-site/lib/CoursesCardData';

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <div className="group relative w-40 h-36 md:w-56 md:h-36 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex items-center justify-center p-5">
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />

      {/* Logo */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={company.logo}
          alt={company.alt}
          width={160}
          height={160}
          className="object-contain max-w-full max-h-full opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
          onError={(e) => {
            const parent = (e.target as HTMLElement).parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-sm font-semibold text-gray-700">${company.name}</span>`;
            }
          }}
        />
      </div>

      {/* Tooltip */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none bg-orange-500 rounded-lg">
        <div className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap relative">
          {company.name}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      </div>
    </div>
  );
};