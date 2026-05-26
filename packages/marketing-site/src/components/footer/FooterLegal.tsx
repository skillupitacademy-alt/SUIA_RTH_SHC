
'use client';


import React from 'react';
import { useMarketingContent } from '@quiz/marketing-site';

const FooterLegal: React.FC = () => {
  const { footer } = useMarketingContent();

  return (
    <div>
      <h4 className="text-lg font-bold mb-4 text-gray-900">Legal</h4>
      
      {/* Policy Links */}
      <ul className="space-y-2 mb-6">
        {footer.policyLinks.map((policy) => (
          <li key={policy.label}>
            <a
              href={policy.href ?? "#"}
              className="text-gray-600 hover:text-blue-600 flex items-center"
            >
              <span className="text-gray-400 mr-2">-</span>
              {policy.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Payment Methods */}
      <div className="space-y-3">
        <div className="text-gray-600 flex items-center">
          <span className="text-gray-400 mr-2">-</span>
          We Accept
        </div>
        
        <div className="flex flex-wrap gap-2">
          {footer.paymentMethods.map((method) => (
            <div
              key={method.name}
              className="text-gray-600 bg-gray-100 px-3 py-1 rounded text-sm"
            >
              {method.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FooterLegal;
