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
  colorHex: string;
}

export const WHY_US_CARDS: CardItem[] = [
  {
    id: 1,
    icon: Target,
    heading: "100% Placement Assistance",
    subheading: "Comprehensive career support with job placement assistance",
    colorHex: "#6366f1"
  },
  {
    id: 2,
    icon: Users,
    heading: "Live Interactive Classes",
    subheading: "Real-time learning with expert instructors",
    colorHex: "#e11d48"
  },
  {
    id: 3,
    icon: Layers,
    heading: "Hands-on Projects",
    subheading: "Practical experience with real-world projects",
    colorHex: "#10b981"
  },
  {
    id: 4,
    icon: Award,
    heading: "Industry Recognition",
    subheading: "Courses recognized by top industry leaders",
    colorHex: "#d97706"
  },
  {
    id: 5,
    icon: Globe,
    heading: "Lifelong Learning Community",
    subheading: "Continuous learning with peer support network",
    colorHex: "#8b5cf6"
  },
  {
    id: 6,
    icon: Briefcase,
    heading: "Assured Internship",
    subheading: "Guaranteed internship opportunities",
    colorHex: "#06b6d4"
  },
  {
    id: 7,
    icon: FileText,
    heading: "Industry-Ready Curriculum",
    subheading: "Designed in collaboration with leading tech companies",
    colorHex: "#d946ef"
  },
  {
    id: 8,
    icon: UserCheck,
    heading: "Expert Mentor Support",
    subheading: "1:1 mentorship from industry veterans",
    colorHex: "#0ea5e9"
  },
  {
    id: 9,
    icon: BookOpen,
    heading: "Structured Learning Path",
    subheading: "Personalized roadmap that adapts to your learning pace",
    colorHex: "#14b8a6"
  },
  {
    id: 10,
    icon: Headphones,
    heading: "Career Services & Support",
    subheading: "End-to-end career guidance and support",
    colorHex: "#f97316"
  },
  {
    id: 11,
    icon: Clock,
    heading: "Flexible Learning Schedule",
    subheading: "Learn at your own pace and convenience",
    colorHex: "#ec4899"
  },
  {
    id: 12,
    icon: BadgeCheck,
    heading: "Industry Certifications",
    subheading: "Earn recognized certifications to boost your career",
    colorHex: "#3b82f6"
  }
];

export const SECTION_CONFIG = {
  title: "Why Choose Us",
  description: "We're committed to your success with proven methods, industry-aligned curriculum and dedicated support to transform your career in technology.",
  accentColor: "from-blue-600 to-purple-600",
  textColor: "text-gray-900"
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