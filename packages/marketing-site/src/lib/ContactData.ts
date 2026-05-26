
export interface ContactInfo {
  type: 'phone' | 'whatsapp' | 'location';
  label: string;
  value: string;
  icon: string;
  color: 'blue' | 'green';
  action?: () => void;
  description?: string;
}

export interface WorkingHours {
  day: string;
  hours: string;
}

export type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export const CONTACT_CONFIG = {
  title: 'Contact Us',
  description: 'Get in touch to start your learning journey today',
  phoneNumber: '9967599801',
  defaultMessage: 'Hello! I would like to learn more about your courses.',
};

export const CONTACT_INFO: ContactInfo[] = [
  {
    type: 'phone',
    label: 'Call Us',
    value: CONTACT_CONFIG.phoneNumber,
    icon: '📞',
    color: 'blue',
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    value: CONTACT_CONFIG.phoneNumber,
    icon: '💬',
    color: 'green',
  },
  {
    type: 'location',
    label: 'Our Location',
    value: 'Neelyog Square 205, 2nd Floor',
    icon: '📍',
    color: 'blue',
    description: 'R. B. Mehta, Opp Ghatkopar East Railway Station',
  },
];

export const WORKING_HOURS: WorkingHours[] = [
  { day: 'Monday - Friday', hours: '9:00 AM - 7:00 PM' },
  { day: 'Saturday', hours: '10:00 AM - 5:00 PM' },
  { day: 'Sunday', hours: '10:00 AM - 2:00 PM' },
];

export const LOCATION_INFO = {
  address: 'Neelyog Square 205, 2nd Floor\nR. B. Mehta Road, Ghatkopar East, Mumbai',
  landmark: 'Opposite Chatkopar East Railway Station',
  mapUrl: 'https://maps.google.com/?q=Neelyog+Square+205+Ghatkopar+East+Mumbai',
};