

import React from 'react';
import { MapPin, Phone, Mail, Link as LinkIcon } from 'lucide-react';

const FooterContact: React.FC = () => {
  return (
    <div className="lg:col-span-2">
      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h4 className="text-lg font-bold mb-3 text-gray-900">
          Contact Info
        </h4>

        <div className="space-y-3 text-gray-600">

          {/* Address */}
          <div className="flex items-start">
            <MapPin aria-hidden="true" className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <p>
              Neelyog Square 205, 2nd Floor <br />
              R. B. Mehta, Opp Ghatkopar East Railway Station
            </p>
          </div>

          {/* Phone */}
          <div className="flex items-center">
            <Phone aria-hidden="true" className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
            <a
              href="tel:+919967599801"
              className="hover:text-blue-600 transition-colors"
            >
              9967599801
            </a>
          </div>

          {/* Email */}
          <div className="flex items-center">
            <Mail aria-hidden="true" className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
            <a
              href="mailto:hello@teamhub.com"
              className="hover:text-blue-600 transition-colors"
            >
              https://skillupitacademy.com/
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FooterContact;
