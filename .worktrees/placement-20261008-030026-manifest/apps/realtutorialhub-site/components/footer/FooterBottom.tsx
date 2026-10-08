

import React from 'react';
import { Clock, CheckCircle2, Phone } from 'lucide-react';

const FooterBottom: React.FC = () => {
  return (
    <div className="border-t border-gray-300 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">

        {/* Left: Copyright */}
        <div className="text-gray-500 text-sm flex items-center">
          <Clock aria-hidden="true" className="w-4 h-4 mr-2 text-blue-500" />
          © 2025
          <span className="text-blue-600 font-medium ml-1">
            Real Tutorial Hub
          </span>
          . All rights reserved.
        </div>

        {/* Right: Support + CTA */}
        <div className="flex items-center space-x-4">

          {/* Live Support */}
          <div className="text-sm text-gray-500 flex items-center">
            <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 mr-2 text-green-500" />
            Live Support Available
          </div>

          {/* Call Now */}
          <a
            href="tel:+919876543210"
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
