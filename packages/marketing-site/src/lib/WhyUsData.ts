import {
  Target,
  Users,
  Layers,
  Award,
  Globe,
  Briefcase,
  FileText,
  UserCheck,
  Clock,
  Headphones,
  BookOpen,
  BadgeCheck
} from "lucide-react";

export interface CardItem {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  subheading: string;
  theme: 'primary' | 'secondary';
  underlineTheme: 'primary' | 'secondary';
}

export const WHY_US_CARDS: CardItem[] = [
  {
    id: 1,
    icon: Target,
    heading: "100% Placement Assistance",
    subheading: "Comprehensive career support with job placement assistance",
    theme: 'primary',
    underlineTheme: 'secondary'
  },
  {
    id: 2,
    icon: Users,
    heading: "Live Interactive Classes",
    subheading: "Real-time learning with expert instructors",
    theme: 'secondary',
    underlineTheme: 'secondary'
  },
  {
    id: 3,
    icon: Layers,
    heading: "Hands-on Projects",
    subheading: "Practical experience with real-world projects",
    theme: 'primary',
    underlineTheme: 'primary'
  },
  {
    id: 4,
    icon: Award,
    heading: "Industry Recognition",
    subheading: "Courses recognized by top industry leaders",
    theme: 'secondary',
    underlineTheme: 'secondary'
  },
  {
    id: 5,
    icon: Globe,
    heading: "Lifelong Learning Community",
    subheading: "Continuous learning with peer support network",
    theme: 'primary',
    underlineTheme: 'primary'
  },
  {
    id: 6,
    icon: Briefcase,
    heading: "Assured Internship",
    subheading: "Guaranteed internship opportunities",
    theme: 'secondary',
    underlineTheme: 'secondary'
  },
  {
    id: 7,
    icon: FileText,
    heading: "Industry-Ready Curriculum",
    subheading: "Designed in collaboration with leading tech companies",
    theme: 'primary',
    underlineTheme: 'secondary'
  },
  {
    id: 8,
    icon: UserCheck,
    heading: "Expert Mentor Support",
    subheading: "1:1 mentorship from industry veterans",
    theme: 'secondary',
    underlineTheme: 'secondary'
  },
  {
    id: 9,
    icon: BookOpen,
    heading: "Structured Learning Path",
    subheading: "Personalized roadmap that adapts to your learning pace",
    theme: 'primary',
    underlineTheme: 'primary'
  },
  {
    id: 10,
    icon: Headphones,
    heading: "Career Services & Support",
    subheading: "End-to-end career guidance and support",
    theme: 'secondary',
    underlineTheme: 'secondary'
  },
  {
    id: 11,
    icon: Clock,
    heading: "Flexible Learning Schedule",
    subheading: "Learn at your own pace and convenience",
    theme: 'primary',
    underlineTheme: 'primary'
  },
  {
    id: 12,
    icon: BadgeCheck,
    heading: "Industry Certifications",
    subheading: "Earn recognized certifications to boost your career",
    theme: 'secondary',
    underlineTheme: 'secondary'
  }
];

export const COLOR_CONFIGS = {
  primary: {
    iconBg: 'bg-[var(--brand-primary)]',
    iconColor: 'text-white',
    heading: 'text-[var(--brand-primary)]',
    check: 'text-[var(--brand-primary)]',
    border: 'border-slate-100',
    hoverBorder: 'hover:border-[var(--brand-primary)]',
    shadow: 'shadow-md',
  },
  secondary: {
    iconBg: 'bg-[var(--brand-secondary)]',
    iconColor: 'text-white',
    heading: 'text-[var(--brand-secondary)]',
    check: 'text-[var(--brand-secondary)]',
    border: 'border-slate-100',
    hoverBorder: 'hover:border-[var(--brand-secondary)]',
    shadow: 'shadow-md',
  }
} as const;

export const UNDERLINE_CONFIGS = {
  primary: 'bg-[var(--brand-primary)]',
  secondary: 'bg-[var(--brand-secondary)]'
} as const;

export const SECTION_CONFIG = {
  title: "Why Choose Us",
  description: "We're committed to your success with proven methods, industry-aligned curriculum and dedicated support to transform your career in technology.",
  accentColor: "from-[var(--brand-primary)] to-[var(--brand-secondary)]",
  textColor: "text-[var(--brand-primary)]"
} as const;