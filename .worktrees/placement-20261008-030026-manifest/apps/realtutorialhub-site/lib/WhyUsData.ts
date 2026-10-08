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
    iconBg: 'bg-blue-600',
    iconColor: 'text-white',
    heading: 'text-blue-900',
    check: 'text-blue-600',
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-300',
    shadow: 'shadow-md',
  },
  secondary: {
    iconBg: 'bg-orange-500',
    iconColor: 'text-white',
    heading: 'text-orange-900',
    check: 'text-orange-500',
    border: 'border-orange-100',
    hoverBorder: 'hover:border-orange-300',
    shadow: 'shadow-md',
  }
} as const;

export const UNDERLINE_CONFIGS = {
  primary: 'bg-blue-600',
  secondary: 'bg-orange-500'
} as const;

export const SECTION_CONFIG = {
  title: "Why Choose Us",
  description: "We're committed to your success with proven methods, industry-aligned curriculum and dedicated support to transform your career in technology.",
  accentColor: "from-blue-600 to-blue-800",
  textColor: "text-blue-900"
} as const;