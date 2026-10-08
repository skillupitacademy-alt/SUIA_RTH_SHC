'use client';

import React from 'react';
import { Award, CheckCircle, Star } from 'lucide-react';

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
}) => (
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
          <div className="absolute -inset-6 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
          <div className="relative bg-gradient-to-br from-amber-50 to-yellow-100 p-10 rounded-3xl border-4 border-amber-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transform rotate-3 group-hover:rotate-0 transition-all duration-700">
            <div className="text-center">
              <div className="inline-flex p-6 bg-amber-100 rounded-3xl mb-8">
                <Award className="w-20 h-20 text-amber-600" />
              </div>
              <div className="mb-8">
                <div className="font-bold text-gray-900 text-3xl mb-3">
                  {certificateDetails.title}
                </div>
                <div className="text-gray-600 text-xl">{certificateDetails.subtitle}</div>
                <div className="text-gray-600 text-lg">{certificateDetails.subSubtitle}</div>
              </div>
              <div className="text-gray-500 text-sm mb-6">
                Industry-Recognized • Globally Valid • Hiring Partner Verified
              </div>
              <div className="pt-8 border-t border-amber-200">
                <div className="flex justify-center gap-2">
                  {[...Array(certificateDetails.rating)].map((_, i) => (
                    <Star key={i} className="w-7 h-7 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <div className="text-gray-500 text-sm mt-3">Rated {certificateDetails.rating}/5 by Industry Experts</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);