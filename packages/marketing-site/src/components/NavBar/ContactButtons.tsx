import React from 'react';
import { 
  contactButtons, 
} from '@quiz/marketing-site/lib/NavBarData';

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
              className="flex items-center gap-2 px-5 py-2.5 font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
              style={{
                border: button.type === 'whatsapp' ? '1px solid var(--brand-primary)' : undefined,
                color: button.type === 'whatsapp' ? 'var(--brand-primary)' : '#ffffff',
                backgroundColor: button.type === 'phone' ? 'var(--brand-secondary)' : undefined,
              }}
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
            className={`flex items-center justify-center gap-2 px-3 py-3 font-medium rounded-md transition-all text-white ${
              button.type === 'phone' ? 'mt-2' : ''
            }`}
            style={{
              backgroundColor:
                button.type === 'whatsapp'
                  ? 'var(--brand-primary)'
                  : 'var(--brand-secondary)',
            }}
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
