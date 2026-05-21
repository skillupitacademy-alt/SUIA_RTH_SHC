

import React from 'react';
import {
  ContactInfo as ContactInfoType,
  CONTACT_INFO,
  WORKING_HOURS
} from '@/lib/ContactData';

interface ContactInfoProps {
  onCallClick: () => void;
  onWhatsAppClick: () => void;
  onMapClick: () => void;
}

const ContactInfo: React.FC<ContactInfoProps> = ({
  onCallClick,
  onWhatsAppClick,
  onMapClick,
}) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-100',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-100',
        button: 'border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleContactAction = (type: string) => {
    switch (type) {
      case 'phone':
        onCallClick();
        break;
      case 'whatsapp':
        onWhatsAppClick();
        break;
      case 'location':
        onMapClick();
        break;
    }
  };

  return (
    <div>
      {/* Main card slides in from the left */}
      <div
        className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100 shadow-sm h-[520px]"
        style={{ boxShadow: "2px 2px 20px 0.6px #00000025" }}
      >
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Get In Touch</h2>

        <div className="space-y-6">
          {CONTACT_INFO.map((info: ContactInfoType, index) => {
            const colorClasses = getColorClasses(info.color);
            return (
              <div
                key={info.type}
                className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200"
                style={{ boxShadow: "2px 2px 20px 0.2px #00000013", borderColor: `${colorClasses.border.replace('border-', '')}` }}
              >
                <div className={`w-10 h-10 ${colorClasses.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className={`${colorClasses.text} font-bold`}>{info.icon}</span>
                </div>
                <div className="flex-1">

                  <h3 className="font-semibold text-gray-800">{info.label}</h3>

                  <button
                    onClick={() => handleContactAction(info.type)}
                    className={`${colorClasses.text} hover:opacity-80 font-medium text-md`}
                  >
                    {info.value}
                  </button>

                  {info.description && (
                    <p className="text-gray-600 text-sm mt-1">{info.description}</p>
                  )}

                </div>
              </div>
            );
          })}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={onCallClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              style={{ boxShadow: "2px 2px 20px 0.2px #00000026" }}
            >
              Call Now
            </button>
            <button
              onClick={onWhatsAppClick}
              className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-medium py-3 rounded-lg transition-colors"
              style={{ boxShadow: "2px 2px 20px 0.2px #00000026" }}
            >
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Working Hours card slides in from the right */}
      <div
        className="mt-6 bg-gray-50 rounded-xl p-5"
        style={{ boxShadow: "2px 2px 20px 0.6px #00000025" }}

      >
        <h3 className="font-semibold text-gray-800 mb-3">Working Hours</h3>
        <div className="space-y-2 text-sm text-gray-600">
          {WORKING_HOURS.map((hours, index: number) => (
            <div
              key={index}
              className="flex justify-between"
            >
              <span>{hours.day}</span>
              <span className="text-gray-800">{hours.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;