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
  color: 'blue' | 'orange';
  shade: 'light' | 'medium' | 'dark';
}

export const WHY_US_CARDS: CardItem[] = [
  {
    id: 1,
    icon: Target,
    heading: "100% Placement Assistance",
    subheading: "Comprehensive career support with job placement assistance",
    color: 'blue',
    shade: 'light'
  },
  {
    id: 2,
    icon: Users,
    heading: "Live Interactive Classes",
    subheading: "Real-time learning with expert instructors",
    color: 'orange',
    shade: 'light'
  },
  {
    id: 3,
    icon: Layers,
    heading: "Hands-on Projects",
    subheading: "Practical experience with real-world projects",
    color: 'blue',
    shade: 'medium'
  },
  {
    id: 4,
    icon: Award,
    heading: "Industry Recognition",
    subheading: "Courses recognized by top industry leaders",
    color: 'orange',
    shade: 'medium'
  },
  {
    id: 5,
    icon: Globe,
    heading: "Lifelong Learning Community",
    subheading: "Continuous learning with peer support network",
    color: 'blue',
    shade: 'dark'
  },
  {
    id: 6,
    icon: Briefcase,
    heading: "Assured Internship",
    subheading: "Guaranteed internship opportunities",
    color: 'orange',
    shade: 'dark'
  },
  {
    id: 7,
    icon: FileText,
    heading: "Industry-Ready Curriculum",
    subheading: "Designed in collaboration with leading tech companies",
    color: 'blue',
    shade: 'light'
  },
  {
    id: 8,
    icon: UserCheck,
    heading: "Expert Mentor Support",
    subheading: "1:1 mentorship from industry veterans",
    color: 'orange',
    shade: 'light'
  },
  {
    id: 9,
    icon: BookOpen,
    heading: "Structured Learning Path",
    subheading: "Personalized roadmap that adapts to your learning pace",
    color: 'blue',
    shade: 'medium'
  },
  {
    id: 10,
    icon: Headphones,
    heading: "Career Services & Support",
    subheading: "End-to-end career guidance and support",
    color: 'orange',
    shade: 'medium'
  },
  {
    id: 11,
    icon: Clock,
    heading: "Flexible Learning Schedule",
    subheading: "Learn at your own pace and convenience",
    color: 'blue',
    shade: 'dark'
  },
  {
    id: 12,
    icon: BadgeCheck,
    heading: "Industry Certifications",
    subheading: "Earn recognized certifications to boost your career",
    color: 'orange',
    shade: 'dark'
  }
];


export const COLOR_CONFIGS = {
  blue: {
    light: {
      gradient: 'from-blue-50 via-blue-100 to-sky-50',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      shadow: 'hover:shadow-blue-200/50',
      iconGradient: 'from-blue-400 to-sky-500',
      text: 'text-blue-900',
      underline: 'from-blue-400 to-sky-500'
    },
    medium: {
      gradient: 'from-blue-100 via-sky-100 to-blue-50',
      border: 'border-blue-300',
      hoverBorder: 'hover:border-blue-500',
      shadow: 'hover:shadow-blue-300/50',
      iconGradient: 'from-blue-500 to-sky-600',
      text: 'text-blue-900',
      underline: 'from-blue-500 to-sky-600'
    },
    dark: {
      gradient: 'from-blue-200 via-sky-200 to-blue-100',
      border: 'border-blue-400',
      hoverBorder: 'hover:border-blue-600',
      shadow: 'hover:shadow-blue-400/50',
      iconGradient: 'from-blue-600 to-sky-700',
      text: 'text-blue-900',
      underline: 'from-blue-600 to-sky-700'
    }
  },
  orange: {
    light: {
      gradient: 'from-orange-50 via-amber-100 to-orange-50',
      border: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
      shadow: 'hover:shadow-orange-200/50',
      iconGradient: 'from-orange-400 to-amber-500',
      text: 'text-orange-900',
      underline: 'from-orange-400 to-amber-500'
    },
    medium: {
      gradient: 'from-orange-100 via-amber-100 to-orange-50',
      border: 'border-orange-300',
      hoverBorder: 'hover:border-orange-500',
      shadow: 'hover:shadow-orange-300/50',
      iconGradient: 'from-orange-500 to-amber-600',
      text: 'text-orange-900',
      underline: 'from-orange-500 to-amber-600'
    },
    dark: {
      gradient: 'from-orange-200 via-amber-200 to-orange-100',
      border: 'border-orange-400',
      hoverBorder: 'hover:border-orange-600',
      shadow: 'hover:shadow-orange-400/50',
      iconGradient: 'from-orange-600 to-amber-700',
      text: 'text-orange-900',
      underline: 'from-orange-600 to-amber-700'
    }
  }
} as const;

export const SECTION_CONFIG = {
  title: "Why Choose Us",
  description: "We're committed to your success with proven methods, industry-aligned curriculum and dedicated support to transform your career in technology.",
  accentColor: "from-orange-500 via-orange-400 to-orange-500",
  textColor: "#4B49AC"
} as const;