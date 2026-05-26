
'use client';

import React from 'react';
import ContactInfo from './ContactInfo';
import LocationCard from './LocationCard';
import { CONTACT_CONFIG, LOCATION_INFO, WORKING_HOURS } from '@quiz/marketing-site/lib/ContactData';
import { trackLead } from '@quiz/marketing-site/lib/tracking';
import { SectionHeader } from '../CommonHeader/SectionHeader';
import { useBrand } from '@quiz/marketing-site/brand';

const ContactUs: React.FC = () => {
  const brand = useBrand();

  const handleWhatsAppClick = () => {
    trackLead('General', 'Contact Page - WhatsApp');
    const message =
      `Hi ${brand.name}! 👋\n\n` +
      `💬 *General Enquiry*\n\n` +
      `I'd like to learn more about your courses and programs. Could you please guide me on the available options, schedules, and fees?\n\n` +
      `Thank you!`;
    const whatsappUrl = `https://wa.me/${CONTACT_CONFIG.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = () => {
    window.location.href = `tel:${CONTACT_CONFIG.phoneNumber}`;
  };

  const handleMapClick = () => {
    window.open(LOCATION_INFO.mapUrl, '_blank');
  };

  return (
    <section id='contact' className="py-16 md:py-20">
      <div className="mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title={CONTACT_CONFIG.title} description={CONTACT_CONFIG.description} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column - Contact Information */}
          <ContactInfo
            onCallClick={handleCallClick}
            onWhatsAppClick={handleWhatsAppClick}
            onMapClick={handleMapClick}
          />

          {/* Right Column - Working Hours & Location */}
          <div className="flex flex-col gap-6 h-full lg:h-[520px]">
            <div
              className="bg-gray-50 rounded-xl p-6 flex-1 flex flex-col justify-center"
              style={{ boxShadow: "2px 2px 20px 0.6px #00000025" }}
            >
              <h3 className="text-xl font-bold text-blue-700 mb-4">Working Hours</h3>
              <div className="space-y-3 text-gray-600">
                {WORKING_HOURS.map((hours, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-medium">{hours.day}</span>
                    <span className="text-gray-800 font-semibold">{hours.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <LocationCard onMapClick={handleMapClick} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;