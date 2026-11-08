// components/footer/FooterBrand.tsx
'use client';

import React from 'react';
import { useBrand } from '@quiz/marketing-site';

const FooterBrand: React.FC = () => {
  const brand = useBrand();

  return (
    <div className="lg:col-span-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-gray-900">
          {brand.name}
        </h2>
        <p className="text-gray-600">
          Explore our programs and learning resources.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h3 className="text-lg font-bold mb-2 text-gray-900">Stay Updated</h3>
        <p className="text-gray-600">Newsletter subscriptions are currently unavailable.</p>
      </div>
    </div>
  );
};

export default FooterBrand;
