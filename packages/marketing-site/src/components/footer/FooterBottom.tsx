'use client';

import React from 'react';
import { CheckCircle2, Clock, Phone } from 'lucide-react';

import { useBrand, useMarketingContent } from '@quiz/marketing-site';

const FooterBottom: React.FC = () => {
  const brand = useBrand();
  const { footer } = useMarketingContent();
  const phone = footer.contactInfo.find((item) => item.type === 'phone');

  return (
    <div className="border-t border-gray-300 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-gray-500 text-sm flex items-center">
          <Clock aria-hidden="true" className="w-4 h-4 mr-2 text-blue-500" />
          © 2026
          <span className="text-blue-600 font-medium ml-1">{brand.name}</span>
          . All rights reserved.
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 flex items-center">
            <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 mr-2 text-green-500" />
            Live Support Available
          </div>

          <a
            href={phone ? `tel:+91${phone.value}` : '#'}
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-3 py-1.5 rounded font-medium flex items-center"
          >
            <Phone aria-hidden="true" className="w-4 h-4 mr-1" />
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default FooterBottom;
