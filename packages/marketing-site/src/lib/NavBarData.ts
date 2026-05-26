import { IconType } from 'react-icons';
import { FaWhatsapp, FaPhoneAlt } from 'react-icons/fa';

/* =========================
   Interfaces
========================= */

export interface NavItem {
  name: string;
  id: string;
}

export interface ContactButton {
  type: 'whatsapp' | 'phone';
  href: string;
  label: string;
  icon: IconType;
}

/* =========================
   Navigation Items
========================= */

export const navItems: NavItem[] = [
  { name: 'Home', id: 'hero' },
  { name: 'Why Us', id: 'why-us' },
  { name: 'Courses', id: 'courses' },
  { name: 'Learning Path', id: 'learning-path' },
  { name: 'Testimonials', id: 'testimonials' },
  { name: 'Contact', id: 'contact' }
];

/* =========================
   Contact Buttons
========================= */

export const contactButtons: ContactButton[] = [
  {
    type: 'whatsapp',
    href: 'https://wa.me/919967599801?text=Hi%20SkillUpIT%20Academy!%20%F0%9F%91%8B%0A%0A%F0%9F%92%AC%20*General%20Enquiry*%0A%0AI%27d%20like%20to%20learn%20more%20about%20your%20courses%20and%20programs.%20Could%20you%20please%20guide%20me%20on%20the%20available%20options%2C%20schedules%2C%20and%20fees%3F%0A%0AThank%20you!',
    label: 'WhatsApp',
    icon: FaWhatsapp
  },
  {
    type: 'phone',
    href: 'tel:+919967599801',
    label: 'Call Us',
    icon: FaPhoneAlt
  }
];

/* =========================
   Button Classes
========================= */

export const getButtonClasses = (
  type: 'whatsapp' | 'phone'
): string => {
  const base =
    'flex items-center gap-2 px-5 py-2.5 font-medium rounded-lg transition-all shadow-md hover:shadow-lg';

  if (type === 'whatsapp') {
    return `${base} border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white`;
  }

  return `${base} bg-blue-600 text-white hover:bg-blue-700`;
};

export const getMobileButtonClasses = (
  type: 'whatsapp' | 'phone'
): string => {
  const base =
    'flex items-center justify-center gap-2 px-3 py-3 font-medium rounded-md transition-all';

  if (type === 'whatsapp') {
    return `${base} bg-orange-500 text-white hover:bg-orange-600`;
  }

  return `${base} bg-blue-600 text-white hover:bg-blue-700`;
};
