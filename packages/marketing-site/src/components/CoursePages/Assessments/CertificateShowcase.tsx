'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle, Star } from 'lucide-react';
import { useBrand } from "@quiz/marketing-site/brand";

interface CertificateShowcaseProps {
  title: string;
  description: string;
  benefits: string[];
  certificateDetails: {
    title: string;
    subtitle: string;
    subSubtitle: string;
    rating: number;
  };
}

export const CertificateShowcase: React.FC<CertificateShowcaseProps> = ({
  title,
  description,
  benefits,
  certificateDetails
}) => {
  const brand = useBrand();

  return (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-16 text-white mb-12">
    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
      <div className="flex-1">
        <h2 className="text-center text-xl md:text-left md:text-4xl font-bold mb-6">{title}</h2>
        <p className="text-gray-300 mb-8 text-sm md:text-lg leading-relaxed">
          {description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <span className="text-lg">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <button className="w-50 h-15 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition transform hover:-translate-y-1 hover:shadow-2xl">
            View Sample Certificate
          </button>
          <button className="w-25 h-15 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition transform hover:-translate-y-1 hover:shadow-2xl">
            Enroll Now
          </button>
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative group">
          <div 
            className="absolute -inset-6 rounded-3xl blur-[100px] opacity-30 mix-blend-screen transition-all duration-700 group-hover:opacity-50" 
            style={{ backgroundColor: "var(--brand-secondary)" }}
          ></div>
          <div className="relative bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl transform rotate-3 group-hover:rotate-0 transition-all duration-700">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                  <Image 
                    src={brand.logo} 
                    alt={brand.name} 
                    width={200} 
                    height={60} 
                    className="h-14 w-auto object-contain drop-shadow-xl" 
                  />
                </div>
              </div>
              <div className="mb-8">
                <div className="font-bold text-white text-3xl mb-3 drop-shadow-md">
                  {certificateDetails.title}
                </div>
                <div className="text-white/90 text-xl font-medium">{certificateDetails.subtitle}</div>
                <div className="text-white/70 text-lg mt-2">{certificateDetails.subSubtitle}</div>
              </div>
              <div className="text-white/50 text-xs mb-6 uppercase tracking-[0.2em] font-bold">
                Industry-Recognized • Globally Valid • Verified by {brand.name}
              </div>
              <div className="pt-8 border-t border-white/10">
                <div className="flex justify-center gap-2">
                  {[...Array(certificateDetails.rating)].map((_, i) => (
                    <Star key={i} className="w-7 h-7 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                  ))}
                </div>
                <div className="text-white/60 text-sm mt-3 font-medium">Rated {certificateDetails.rating}/5 by Industry Experts</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};