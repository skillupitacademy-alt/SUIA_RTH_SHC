// components/footer/FooterBrand.tsx
'use client';

import React from 'react';

const FooterBrand: React.FC = () => {
  return (
    <div className="lg:col-span-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-gray-900">
          Real <span className="text-blue-600">Tutorial</span> Hub
        </h2>
        <p className="text-gray-600">
          Explore our programs and learning resources.
        </p>
      </div>

      {/* Newsletter */}
      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h3 className="text-lg font-bold mb-2 text-gray-900">Stay Updated</h3>
        <p className="text-gray-600">Newsletter subscriptions are currently unavailable.</p>
      </div>
    </div>
  );
};

export default FooterBrand;
