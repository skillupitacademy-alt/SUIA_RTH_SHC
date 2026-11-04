// components/footer/FooterBrand.tsx
'use client';

import React from 'react';
import { useBrand, useMarketingContent } from '@quiz/marketing-site';

const FooterBrand: React.FC = () => {
  const brand = useBrand();
  const { footer } = useMarketingContent();

  return (
    <div className="lg:col-span-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-gray-900">
          {brand.name}
        </h2>
        <p className="text-gray-600">
          Join <span className="font-bold" style={{ color: "var(--brand-primary)" }}>{footer.brand.studentCount}</span> students who have successfully launched their tech careers with our expert-led programs and placement support.
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
