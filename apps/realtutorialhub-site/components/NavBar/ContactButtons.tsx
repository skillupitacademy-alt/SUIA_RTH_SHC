import React from 'react';
import { 
  contactButtons, 
  getButtonClasses, 
  getMobileButtonClasses 
} from '@/lib/NavBarData';

interface ContactButtonsProps {
  variant: 'desktop' | 'mobile';
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ variant }) => {
  if (variant === 'desktop') {
    return (
      <>
        {contactButtons.map((button) => {
          const Icon = button.icon;

          return (
            <a
              key={button.type}
              href={button.href}
              target={button.type === 'whatsapp' ? '_blank' : undefined}
              rel={button.type === 'whatsapp' ? 'noopener noreferrer' : undefined}
              className={getButtonClasses(button.type)}
            >
              {/* ICON */}
              <Icon className="w-4 h-4 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />

              {/* TEXT */}
              <span className="text-sm lg:text-xs xl:text-sm">
                {button.label}
              </span>
            </a>
          );
        })}
      </>
    );
  }

  return (
    <>
      {contactButtons.map((button) => {
        const Icon = button.icon;

        return (
          <a
            key={button.type}
            href={button.href}
            target={button.type === 'whatsapp' ? '_blank' : undefined}
            rel={button.type === 'whatsapp' ? 'noopener noreferrer' : undefined}
            className={`${getMobileButtonClasses(button.type)} ${
              button.type === 'phone' ? 'mt-2' : ''
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{button.label}</span>
          </a>
        );
      })}
    </>
  );
};

export default ContactButtons;
