'use client';

import React from 'react';
import { Link as LinkIcon, Mail, MapPin, Phone } from 'lucide-react';

import { useMarketingContent } from '@quiz/marketing-site';

const FooterContact: React.FC = () => {
  const { footer } = useMarketingContent();
  const address = footer.contactInfo.find((item) => item.type === 'address');
  const phone = footer.contactInfo.find((item) => item.type === 'phone');
  const email = footer.contactInfo.find((item) => item.type === 'email');
  const website = footer.contactInfo.find((item) => item.type === 'website');

  return (
    <div className="lg:col-span-2">
      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h4 className="text-lg font-bold mb-3 text-gray-900">Contact Info</h4>

        <div className="space-y-3 text-gray-600">
          {address ? (
            <div className="flex items-start">
              <MapPin aria-hidden="true" className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>
                {address.value.split('\n').map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>
          ) : null}

          {phone ? (
            <div className="flex items-center">
              <Phone aria-hidden="true" className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
              <a href={`tel:+91${phone.value}`} className="hover:text-blue-600 transition-colors">
                {phone.value}
              </a>
            </div>
          ) : null}

          {email ? (
            <div className="flex items-center">
              <Mail aria-hidden="true" className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
              <a href={`mailto:${email.value}`} className="hover:text-blue-600 transition-colors">
                {email.value}
              </a>
            </div>
          ) : null}

          {website ? (
            <div className="flex items-center">
              <LinkIcon aria-hidden="true" className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
              <a href={website.value} className="hover:text-blue-600 transition-colors" target="_blank" rel="noreferrer">
                {website.value}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FooterContact;
