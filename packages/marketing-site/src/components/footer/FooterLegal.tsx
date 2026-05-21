

import React from 'react';
import { POLICY_LINKS, PAYMENT_METHODS } from '@quiz/marketing-site/lib/FooterData';

const FooterLegal: React.FC = () => {
  return (
    <div>
      <h4 className="text-lg font-bold mb-4 text-gray-900">Legal</h4>
      
      {/* Policy Links */}
      <ul className="space-y-2 mb-6">
        {POLICY_LINKS.map((policy) => (
          <li key={policy.label}>
            <a
              href="#"
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
          {PAYMENT_METHODS.map((method) => (
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