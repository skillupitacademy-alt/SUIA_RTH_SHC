export interface Course {
  name: string;
  students: string;
}

export interface FooterLink {
  label: string;
  href?: string;
  icon?: string;
}

export interface ContactInfo {
  type: 'address' | 'phone' | 'email' | 'website';
  label: string;
  value: string;
  icon: string;
}

export interface PaymentMethod {
  name: string;
}


export const FOOTER_CONFIG = {
  brand: {
    name: 'Real Tutorial Hub',
    highlight: 'Tutorial',
    description: 'Join 15,000+ students who have successfully launched their tech careers with our expert-led programs and placement support.',
    studentCount: '15K+',
  },
};

export const POPULAR_COURSES: Course[] = [
  { name: "Python Programming", students: "2.4K" },
  { name: "Data Science", students: "3.1K" },
  { name: "Full Stack Development", students: "4.9K" },
  { name: "Generative AI", students: "2.8K" },
  { name: "Cybersecurity", students: "1.9K" },
  { name: "DevOps & Cloud", students: "2.1K" },
];

export const QUICK_LINKS: FooterLink[] = [
  { label: "About Us" },
  { label: "Our Courses" },
  { label: "Success Stories" },
  { label: "Career Support" },
  { label: "Blog & Resources" },
  { label: "Contact Us" },
];

export const POLICY_LINKS: FooterLink[] = [
  { label: "Privacy Policy" },
  { label: "Terms of Service" },
  { label: "Return Policy" },
];

export const CONTACT_INFO: ContactInfo[] = [
  { 
    type: 'address',
    label: 'Address',
    value: 'Neelyog Square 205, 2nd Floor\nR. B. Mehta, Opp Ghatkopar East Railway Station',
    icon: '📍'
  },
  { 
    type: 'phone',
    label: 'Phone',
    value: '9967508801',
    icon: '📞'
  },
  { 
    type: 'email',
    label: 'Email',
    value: 'hello@teamhub.com',
    icon: '✉️'
  },
  { 
    type: 'website',
    label: 'Website',
    value: 'http://amng.csunm.titroudy.tgabfy.edu.si/dev',
    icon: '🔗'
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { name: 'Visa' },
  { name: 'MasterCard' },
  { name: 'PayPal' },
  { name: 'UPI' },
  { name: 'COD' },
];