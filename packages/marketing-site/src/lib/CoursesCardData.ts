
import { IconType } from "react-icons";
import {
  FaShieldAlt,
  FaBolt,
  FaCode,
  FaDatabase,
  FaCloud,
  FaChartBar,
  FaMicrochip,
  FaTerminal,
  FaBrain,
  FaSlack, FaComments, FaTrophy, FaHandshake,
  FaGraduationCap, FaNetworkWired, FaChartLine,
  FaVideo, FaUserGraduate, FaQuestionCircle,
  FaCalendarAlt, FaLaptopCode, FaCalendarDay, FaUsers,
  FaHeadset, FaChalkboardTeacher, FaDownload, FaBug,
  FaCodeBranch, FaWhatsapp, FaEnvelope
} from "react-icons/fa";


export interface HeroSectionProps {
  id: string;
  title: string;
  description: string;
  features?: string[];
  companies?: string[];
  ctaButtons?: {
    primary: string;
    secondary: string;
  };
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface HeroFeature {
  text: string;
}

export interface FloatingIcon {
  top: string;
  left?: string;
  right?: string;
  delay: number;
}

export interface CTAButtons {
  primary: string;
  secondary: string;
}

export interface GradingEvaluationData {
  title: string;
  cards: Array<{
    id: number;
    title: string;
    description: string;
    targetValue: number;
    format: 'percentage' | 'fixed';
    decimalPlaces?: number;
  }>;
}

export interface PlacementService {
  id: number;
  title: string;
  description: string;
  icon: string; // We'll map string to Lucide icon component
  color: string;
  bgColor: string;
  borderColor: string;
  features: Array<{
    text: string;
    completed: boolean;
  }>;
  stats: string;
  highlight: string;
}

export interface PlacementSupportData {
  title: string;
  description: string;
  services: PlacementService[];
}

export interface SuccessStory {
  id: number;
  name: string;
  role: string;
  quote: string;
  achievement: string;
  salary?: string;
  location: string;
  icon: string; // Lucide icon name
  colorClass: string;
}

export interface StatItem {
  icon: string; // Lucide icon name
  label: string;
  value: string;
}

export interface SuccessStoriesData {
  title: string;
  description: string;
  stories: SuccessStory[];
  stats: StatItem[];
}

// Add this to your HeroCommonData interface if you want it shared
export interface HeroCommonData {
  stats: HeroStat[];
  features: HeroFeature[];
  floatingIcons: FloatingIcon[];
  companyNames: string[];
  ctaButtons: CTAButtons;
  // ADD THIS
  gradingEvaluation: GradingEvaluationData;
  placementSupport: PlacementSupportData;
  placementStatistics: PlacementStatisticsData;
  instructorsMentors: InstructorsMentorsData;
  prerequisites: PrerequisitesData;
  successStories: SuccessStoriesData;
  hiringCompanies: CompaniesData;
}

export interface PlacementStatCard {
  id: number;
  title: string;
  targetValue: number;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  format: 'number' | 'percentage' | 'range' | 'currency'; // REMOVE ? and add currency
  decimalPlaces?: number;
}

export interface AdditionalStat {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'star' | 'time' | 'rounds';
}

export interface MentorStat {
  value: string;
  label: string;
  icon: string;
  iconColor: string;
}

export interface Mentor {
  initials: string;
  name: string;
  title: string;
  description: string;
  stats: MentorStat[];
  tags: string[];
  color: string;
  rating: number;
}

export interface InstructorsMentorsData {
  title: string;
  description: string;
  mentors: Mentor[];
}

export interface PlacementStatisticsData {
  title: string;
  description: string;
  mainStats: PlacementStatCard[];
  additionalStats: AdditionalStat[];
}

export interface PrerequisiteItem {
  icon: string;
  title: string;
  subtitle?: string;
  iconColor?: string;
}

export interface PrerequisiteCard {
  id: number;
  title: string;
  icon: string;
  gradient: string;
  bgColor: string;
  borderColor: string;
  items: PrerequisiteItem[];
}

export interface PrerequisitesData {
  title: string;
  description: string;
  cards: PrerequisiteCard[];
}

export interface Company {
  name: string;
  logo: string;
  alt: string;
}

export interface CompaniesData {
  title: string;
  description: string;
  companies: Company[];
}

export interface CurriculumPhase {
  id: number;
  title: string;
  subtitle: string;
  icon: string; // Lucide icon name
  duration: string;
  gradient: string;
  bgColor: string;
  borderColor: string;
  topics: Array<{
    title: string;
    items: string[];
    color: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
    color: string;
  }>;
}

export interface PortfolioProject {
  id: number;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  bgColor: string;
  borderColor: string;
  tags: string[];
}

export interface TechStack {
  category: string;
  icon: string;
  borderColor: string;
  bgColor: string;
  technologies: Array<{
    label: string;
    iconSrc?: string;
    icon?: string;
  }>;
}

export interface CareerOutcome {
  title: string;
  salary: string;
  icon: string;
  gradient: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export interface CurriculumData {
  title: string;
  description: string;
  phases: CurriculumPhase[];
  projects: PortfolioProject[];
  techStack: TechStack[];
  careerOutcomes: CareerOutcome[];
  capstoneData: {
    title: string;
    icon: string;
    bgColor: string;
    borderColor: string;
    projects: string[];
    outcome: string;
  };
  interviewPrep: {
    title: string;
    icon: string;
    bgColor: string;
    borderColor: string;
    technical: string[];
    career: string[];
    outcome: string;
  };
}

export const heroCommonData: HeroCommonData = {
  stats: [
    { value: '600-700', label: 'Learning Hours' },
    { value: '15+', label: 'Real Projects' },
    { value: '90%', label: 'Placement Rate' },
    { value: '12-25 LPA', label: 'Average Salary' },
  ],

  features: [
    { text: 'Live Interactive Classes' },
    { text: 'Hands-on Coding Sessions' },
    { text: 'Industry-Ready Curriculum' },
    { text: 'Lifetime Access & Support' },
  ],

  floatingIcons: [
    { top: '15%', left: '10%', delay: 0 },
    { top: '25%', right: '15%', delay: 0.5 },
    { top: '65%', left: '8%', delay: 1 },
    { top: '70%', right: '12%', delay: 1.5 },
  ],

  companyNames: ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro'],

  ctaButtons: {
    primary: 'Enroll Now - Limited Seats',
    secondary: 'Explore Full Curriculum'
  },

  // ADD THIS NEW SECTION
  gradingEvaluation: {
    title: 'Grading and Evaluation System',
    cards: [
      {
        id: 0,
        title: 'Assignments',
        description: 'Weekly coding challenges and concept applications',
        targetValue: 6.4,
        format: 'percentage',
        decimalPlaces: 1
      },
      {
        id: 1,
        title: 'Project Work',
        description: 'Portfolio projects evaluation and implementation',
        targetValue: 20,
        format: 'percentage'
      },
      {
        id: 2,
        title: 'Participation',
        description: 'Active engagement in discussions and activities',
        targetValue: 10,
        format: 'percentage'
      },
      {
        id: 3,
        title: 'Minimum Grade',
        description: 'Required minimum to pass and earn certification',
        targetValue: 30,
        format: 'percentage'
      }
    ]
  },

  placementSupport: {
    title: 'Placement Support',
    description: 'Comprehensive career services until you get placed',
    services: [
      {
        id: 1,
        title: 'Resume Building',
        description: 'Professional ATS-friendly resume and LinkedIn optimization with expert review and industry-specific templates',
        icon: 'FileText',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/60',
        borderColor: 'border-blue-200/80',
        features: [
          { text: 'ATS-friendly resume', completed: true },
          { text: 'LinkedIn optimization', completed: true },
          { text: 'Expert review', completed: true },
          { text: 'Industry-specific templates', completed: true }
        ],
        stats: 'Professional',
        highlight: '98% ATS Score'
      },
      {
        id: 2,
        title: 'Mock Interviews',
        description: 'Technical and HR rounds with industry experts from top tech companies',
        icon: 'Briefcase',
        color: 'from-orange-500 to-amber-500',
        bgColor: 'bg-gradient-to-br from-orange-50/80 to-amber-50/60',
        borderColor: 'border-orange-200/80',
        features: [
          { text: 'Technical rounds', completed: true },
          { text: 'HR rounds', completed: true },
          { text: 'Industry experts', completed: true },
          { text: 'Top company prep', completed: true }
        ],
        stats: 'Real Practice',
        highlight: '80+ Practice Sessions'
      },
      {
        id: 3,
        title: 'Company Connections',
        description: 'Direct access to 30+ hiring partners including startups, product-based companies, and MNCs',
        icon: 'Building',
        color: 'from-indigo-500 to-purple-500',
        bgColor: 'bg-gradient-to-br from-indigo-50/80 to-indigo-50/60',
        borderColor: 'border-indigo-200/80',
        features: [
          { text: '30+ hiring partners', completed: true },
          { text: 'Startups', completed: true },
          { text: 'Product companies', completed: true },
          { text: 'MNCs', completed: true }
        ],
        stats: 'Direct Access',
        highlight: '30+ Partners'
      },
      {
        id: 4,
        title: 'Job Referrals',
        description: 'Direct referrals to partner companies and startups with priority consideration for our students',
        icon: 'Users',
        color: 'from-emerald-500 to-green-500',
        bgColor: 'bg-gradient-to-br from-emerald-50/80 to-green-50/60',
        borderColor: 'border-emerald-200/80',
        features: [
          { text: 'Direct referrals', completed: true },
          { text: 'Partner companies', completed: true },
          { text: 'Priority consideration', completed: true },
          { text: 'Startup access', completed: true }
        ],
        stats: 'Priority Access',
        highlight: 'Priority Queue'
      }
    ]
  },
  placementStatistics: {
    title: 'Placement Statistics',
    description: 'Real numbers showcasing our placement success and career outcomes',
    mainStats: [
      {
        id: 1,
        title: 'Partner Companies',
        targetValue: 30,
        icon: 'Building',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Top tech companies hiring our graduates',
        format: 'number' // ADD THIS
      },
      {
        id: 2,
        title: 'Placement Rate',
        targetValue: 4.2,
        icon: 'Target',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Within 6 months of completion',
        format: 'percentage', // ADD THIS
        decimalPlaces: 1
      },
      {
        id: 3,
        title: 'Salary Range (LPA)',
        targetValue: 212,
        icon: 'TrendingUp',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        description: 'Average to highest package',
        format: 'range' // ADD THIS
      }
    ],
    additionalStats: [
      {
        title: 'Average CTC',
        value: '₹12.5 LPA',
        change: '+15%',
        trend: 'up'
      },
      {
        title: 'Highest Package',
        value: '₹28 LPA',
        change: 'FAANG',
        trend: 'star'
      },
      {
        title: 'Interview Rounds',
        value: '3-7',
        change: 'Avg.',
        trend: 'rounds'
      },
      {
        title: 'Placement Time',
        value: '4 Months',
        change: 'Avg.',
        trend: 'time'
      }
    ]
  },
  instructorsMentors: {
    title: 'Instructors & Mentors',
    description: 'Learn from industry experts with real-world experience. Get personalized guidance and mentorship.',
    mentors: [
      {
        initials: "RK",
        name: "Rajesh Kumar",
        title: "Senior Developer",
        description: "By Amazon, it's a great conversation for professional development. It is a business - story to celebrate, at the end of the day.",
        stats: [
          {
            value: "3.6K+",
            label: "Mentored",
            icon: "FaUsers",
            iconColor: "text-blue-600"
          },
          {
            value: "24/7",
            label: "Available",
            icon: "FaClock",
            iconColor: "text-purple-600"
          },
          {
            value: "8yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-amber-600"
          }
        ],
        tags: ["Java", "Microservices", "Cloud", "AWS", "Spring Boot"],
        color: "bg-gradient-to-r from-blue-600 to-cyan-500",
        rating: 5.0
      },
      {
        initials: "PS",
        name: "Priya Sharma",
        title: "Frontend Architect",
        description: "Dr Mohseni, Dr Irene-i Rami e Choi Nambragal e Dajat in women fashion. It members and family. Specialized in modern web technologies and UX design.",
        stats: [
          {
            value: "500+",
            label: "Projects",
            icon: "FaCode",
            iconColor: "text-indigo-600"
          },
          {
            value: "4.9",
            label: "Rating",
            icon: "FaStar",
            iconColor: "text-amber-600"
          },
          {
            value: "6yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-emerald-600"
          }
        ],
        tags: ["React", "TypeScript", "Next.js", "UI/UX", "GraphQL", "Design Systems"],
        color: "bg-gradient-to-r from-purple-600 to-purple-500",
        rating: 4.9
      },
      {
        initials: "AP",
        name: "Amit Patel",
        title: "Data Scientist",
        description: "Dr Denis, Dr yu-sa rv@resttracts.com Ecculent exercise / Aegeza sizil v. newsyjrsk was born. Leading AI initiatives and machine learning projects.",
        stats: [
          {
            value: "4.3K+",
            label: "Trained",
            icon: "FaUsers",
            iconColor: "text-green-600"
          },
          {
            value: "Expert",
            label: "Level",
            icon: "FaChartLine",
            iconColor: "text-teal-600"
          },
          {
            value: "9yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-blue-600"
          }
        ],
        tags: ["Python", "Machine Learning", "AI", "TensorFlow", "PyTorch", "NLP"],
        color: "bg-gradient-to-r from-emerald-600 to-green-500",
        rating: 5.0
      }
    ]
  },
  prerequisites: {
    title: 'Prerequisites & Requirements',
    description: 'What you need to get started on the journey. Prepare yourself for an immersive learning experience.',
    cards: [
      {
        id: 1,
        title: 'Technical Prerequisites',
        icon: 'FaCode',
        gradient: 'from-blue-500 to-blue-600',
        bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        borderColor: 'border-2 border-blue-100',
        items: [
          {
            icon: 'FaPython',
            title: 'Basic programming knowledge (preferably Python)',
            iconColor: 'text-blue-600'
          },
          {
            icon: 'FaCode',
            title: 'Control structures & syntax',
            iconColor: 'text-blue-500'
          },
          {
            icon: 'FaTerminal',
            title: 'Problem-solving skills',
            iconColor: 'text-gray-600'
          },
          {
            icon: 'FaJs',
            title: 'Logical thinking ability',
            iconColor: 'text-yellow-500'
          },
          {
            icon: 'FaDatabase',
            title: 'Basic familiarity with programming concepts',
            iconColor: 'text-blue-500'
          }
        ]
      },
      {
        id: 2,
        title: 'System Requirements',
        icon: 'FaDesktop',
        gradient: 'from-emerald-500 to-teal-600',
        bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
        borderColor: 'border-2 border-emerald-100',
        items: [
          {
            icon: 'FaDesktop',
            title: '8GB+ RAM Computer',
            subtitle: 'Minimum requirement',
            iconColor: 'text-emerald-600'
          },
          {
            icon: 'FaWifi',
            title: 'Stable Internet (10+ Mbps)',
            subtitle: 'For live sessions',
            iconColor: 'text-emerald-600'
          },
          {
            icon: 'FaHdd',
            title: '20GB+ Free Storage',
            subtitle: 'For tools & projects',
            iconColor: 'text-emerald-600'
          },
          {
            icon: 'FaVideo',
            title: 'Webcam & Microphone',
            subtitle: 'For interactive sessions',
            iconColor: 'text-emerald-600'
          },
          {
            icon: 'FaChrome',
            title: 'Modern Browser',
            subtitle: 'Chrome/Firefox/Edge latest',
            iconColor: 'text-emerald-600'
          }
        ]
      },
      {
        id: 3,
        title: 'Time Commitment',
        icon: 'FaClock',
        gradient: 'from-orange-500 to-amber-600',
        bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
        borderColor: 'border-2 border-amber-100',
        items: [
          {
            icon: 'FaClock',
            title: '40-50 hours/week',
            subtitle: 'Full-time dedication',
            iconColor: 'text-orange-600'
          },
          {
            icon: 'FaCalendarAlt',
            title: '6-8 months duration',
            subtitle: 'Complete program timeline',
            iconColor: 'text-orange-600'
          },
          {
            icon: 'FaUsers',
            title: '3-4 hours live sessions',
            subtitle: 'Instructor-led classes',
            iconColor: 'text-orange-600'
          },
          {
            icon: 'FaBook',
            title: '2-3 hours daily self-study',
            subtitle: 'Practice & assignments',
            iconColor: 'text-orange-600'
          },
          {
            icon: 'FaLaptopCode',
            title: 'Weekly project submissions',
            subtitle: 'Hands-on practice',
            iconColor: 'text-orange-600'
          }
        ]
      }
    ]
  },
  successStories: {
    title: 'Student Success Stories',
    description: 'Hear from our alumni who transformed their careers with determination and the right guidance.',
    stories: [
      {
        id: 1,
        name: "Rahul Verma",
        role: "Senior Program Manager",
        quote: "The course gave me the foundation to advance my career and work with global teams at a Fortune 500 company.",
        achievement: "Promoted within 6 months of course completion",
        salary: "₹35 LPA",
        location: "Bangalore, India",
        icon: "Globe",
        colorClass: "bg-blue-50 border-blue-200"
      },
      {
        id: 2,
        name: "Priya Singh",
        role: "Full Stack Developer",
        quote: "The comprehensive curriculum and hands-on projects gave me the confidence to transition into tech. The mentor support made all the difference.",
        achievement: "Career transition from marketing to tech",
        salary: "₹28 LPA",
        location: "Delhi, India",
        icon: "TrendingUp",
        colorClass: "bg-purple-50 border-purple-200"
      },
      {
        id: 3,
        name: "Aarav Kapoor",
        role: "Data Scientist",
        quote: "I was hesitant about breaking into tech, but the structured curriculum, mentorship, and hands-on projects helped me land my first tech job with a 25 LPA package.",
        achievement: "First tech job with competitive package",
        salary: "₹25 LPA",
        location: "Hyderabad, India",
        icon: "GraduationCap",
        colorClass: "bg-green-50 border-green-200"
      },
      {
        id: 4,
        name: "Ananya Patel",
        role: "Product Manager",
        quote: "The course provided not just technical skills but also the business acumen needed to excel in product management roles.",
        achievement: "Fast-track promotion to leadership role",
        salary: "₹42 LPA",
        location: "Mumbai, India",
        icon: "Briefcase",
        colorClass: "bg-amber-50 border-amber-200"
      }
    ],
    stats: [
      { icon: "GraduationCap", label: "Alumni", value: "10K+" },
      { icon: "Briefcase", label: "Career Transitions", value: "85%" },
      { icon: "TrendingUp", label: "Salary Hike", value: "3.5x Avg" },
      { icon: "DollarSign", label: "Highest Package", value: "₹1.2 CPA" }
    ]
  },

  hiringCompanies: {
    title: 'Our Alumni Work At Top Companies',
    description: 'Our graduates are making an impact at industry-leading organizations worldwide',
    companies: [
      { name: "TCS", logo: "/TSC.webp", alt: "TCS Logo" },
      { name: "Wipro", logo: "/Wipro.webp", alt: "Wipro Logo" },
      { name: "Tech Mahindra", logo: "/TechMahindra.webp", alt: "Tech Mahindra Logo" },
      { name: "Accenture", logo: "/Accenture.webp", alt: "Accenture Logo" },
      { name: "Capgemini", logo: "/Capgemini.webp", alt: "Capgemini Logo" },
      { name: "HCL", logo: "/HCL.webp", alt: "HCL Logo" },
      { name: "Cognizant", logo: "/Cognizant.webp", alt: "Cognizant Logo" },
    ]
  }
};



export interface AssessmentCard {
  id: number;
  title: string;
  description: string;
  features: string[];
  backContent: {
    points: string[];
    frequency: string;
    weightage: string;
  };
}

export interface CertificateData {
  title: string;
  description: string;
  benefits: string[];
  certificateDetails: {
    title: string;
    subtitle: string;
    subSubtitle: string;
    rating: number;
  };
}

export interface AssessmentCertificationData {
  assessmentCards: AssessmentCard[];
  certificateData: CertificateData;
}

/* =======================
   COURSE DATA
======================= */


export interface Course {
  id: number;
  category: string;
  format: string;
  title: string;
  description: string;
  features: string[];
  image: string;
  slug: string;
  icon: IconType;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroSubDescription?: string;
  companies?: string[];  // ADD THIS
  ctaButtons?: {        // ADD THIS
    primary: string;
    secondary: string;
  };
  assessmentCertification?: AssessmentCertificationData;
  curriculum?: CurriculumData;
}
export type CommunityIconType =
  | 'slack'
  | 'talk'
  | 'competition'
  | 'referral'
  | 'learning'
  | 'connection'
  | 'growth'
  | 'live-class'
  | 'coding-labs'
  | 'mentorship'
  | 'doubt-support'
  | 'schedule'
  | 'practice'
  | 'weekend'
  | 'community'
  | 'installation'
  | 'debugging'
  | 'code-review'
  | 'support-24x7'
  | 'whatsapp'
  | 'live-session'
  | 'forum'
  | 'email';

export const iconMap: Record<CommunityIconType, IconType> = {
  slack: FaSlack,
  talk: FaComments,           // For Weekly Tech Talks
  competition: FaTrophy,
  referral: FaHandshake,
  learning: FaGraduationCap,
  connection: FaNetworkWired,
  growth: FaChartLine,
  'live-class': FaVideo,
  'coding-labs': FaCode,
  'mentorship': FaUserGraduate,
  'doubt-support': FaQuestionCircle, // Changed to different icon for doubts
  'schedule': FaCalendarAlt,
  'practice': FaLaptopCode,
  'weekend': FaCalendarDay,
  'community': FaUsers,
  'installation': FaDownload,
  'debugging': FaBug,
  'code-review': FaCodeBranch,
  'support-24x7': FaHeadset,
  'whatsapp': FaWhatsapp,
  'live-session': FaVideo,
  'forum': FaComments,
  'email': FaEnvelope,
};


export interface CommunityData {
  icon: CommunityIconType;
  heading: string;
  subline: string;
}

export interface AlumniBenefits {
  icon: CommunityIconType;
  name: string;
}

export interface CommunitySectionData {
  title: string;
  description: string;
  communityFeatures: CommunityData[];
  alumniBenefits: AlumniBenefits[];
}

export const communityData: CommunityData[] = [
  {
    icon: 'slack',
    heading: 'Exclusive Slack Community',
    subline: '24/7 access to peers, mentors, and industry experts',
    color: 'blue'
  },
  {
    icon: 'talk',
    heading: 'Weekly Tech Talks',
    subline: 'Guest lectures from industry leaders and hiring managers',
    color: 'green'
  },
  {
    icon: 'competition',
    heading: 'Hackathons & Challenges',
    subline: 'Regular coding competitions with prizes and recognition',
    color: 'orange'
  }
];

export const alumniBenefits: AlumniBenefits[] = [
  {
    icon: 'referral',
    name: 'Job Referrals'
  },
  {
    icon: 'learning',
    name: 'Lifetime Learning'
  },
  {
    icon: 'connection',
    name: 'Industry Connections'
  },
  {
    icon: 'growth',
    name: 'Career Growth'
  }
];

export const CommunitySection: CommunitySectionData = {
  title: "Community & Networking",
  description: "Join a thriving community of developers and industry professionals",
  communityFeatures: communityData,
  alumniBenefits: alumniBenefits
};
// In lib/CoursesCardData.ts
export interface CommunityData {
  icon: CommunityIconType;
  heading: string;
  subline: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'indigo' | 'pink';
}




// Add these to your existing Lib/CoursesCardData.ts file
// Or create a new file like Lib/LearningExperienceData.ts



// In Lib/CoursesCardData.ts

export interface ScheduleItem {
  day: string;
  title: string;
}

export interface TimelineItem {
  id: number;
  icon: CommunityIconType;
  title: string;
  description: string;
  highlight?: string;
  position: 'left' | 'right';
}

// If you still want LearningExperience interface (optional)
export interface LearningExperience {
  icon: CommunityIconType;
  title: string;
  description: string;
  highlight?: string;
}

// For timeline approach - separate data structure
export interface LearningExperienceTimelineData {
  sectionTitle: string;
  sectionDescription: string;
  timeline: TimelineItem[];
  schedule: ScheduleItem[]; // If you want to keep schedule
}

export const timelineData: TimelineItem[] = [
  {
    id: 1,
    icon: 'live-class',
    title: 'Live Interactive Classes',
    description: '3-4 hours/day, 5-6 days/week with industry experts',
    highlight: '3-4 hours/day, 5-6 days/week',
    position: 'left'
  },
  {
    id: 2,
    icon: 'mentorship',
    title: '1:1 Mentorship',
    description: 'Weekly personalized guidance from industry mentors',
    position: 'right'
  },
  {
    id: 3,
    icon: 'coding-labs',
    title: 'Hands-on Coding Labs',
    description: 'Real-time coding environments with Instant feedback',
    position: 'left'
  },
  {
    id: 4,
    icon: 'doubt-support',
    title: '24/7 Doubt Support',
    description: 'Instant doubt resolution via chat and community forums',
    highlight: 'Always available',
    position: 'right'
  }
];

export const scheduleData: ScheduleItem[] = [
  {
    day: 'Mon-Fri',
    title: '3-4 hours Live Classes'
  },
  {
    day: 'Daily',
    title: '2-3 hours Self Practice',
  },
  {
    day: 'Weekends',
    title: 'Project & workshops',
  },
  {
    day: '24/7',
    title: 'Community Support'
  }
];

export const LearningExperienceTimelineData: LearningExperienceTimelineData = {
  sectionTitle: "Learning Experience",
  sectionDescription: "Live sessions • Hands-on labs • 1:1 mentorship • Community support",
  timeline: timelineData,
  schedule: scheduleData // Optional: include if you want schedule section too
};



export interface TechnicalSupportFeature {
  icon: CommunityIconType;
  title: string;
  description: string;
}

export interface SupportChannel {
  icon: CommunityIconType;
  name: string;
  description: string;
}

export interface TechnicalSupportData {
  sectionTitle: string;
  sectionDescription: string;
  tagline: string;
  features: TechnicalSupportFeature[];
  supportChannels: SupportChannel[];
}



// Technical Support Data
export const technicalFeatures: TechnicalSupportFeature[] = [
  {
    icon: 'installation',
    title: 'Software installation',
    description: 'Step-by-step guidance for all tools and IDEs'
  },
  {
    icon: 'debugging',
    title: 'Debugging Assistance',
    description: 'Expert help in resolving technical issues'
  },
  {
    icon: 'code-review',
    title: 'Code Reviews',
    description: 'Personalized feedback on your code quality'
  },
  {
    icon: 'support-24x7',
    title: '24/7 Support',
    description: 'Round-the-clock technical assistance'
  }
];

export const supportChannels: SupportChannel[] = [
  {
    icon: 'whatsapp',
    name: 'WhatsApp Group',
    description: 'Instant doubt resolution'
  },
  {
    icon: 'live-session',
    name: 'Live Sessions',
    description: 'Daily doubt clearing'
  },
  {
    icon: 'forum',
    name: 'Community Forum',
    description: 'Peer-to-peer support'
  },
  {
    icon: 'email',
    name: 'Email Support',
    description: 'Detailed technical queries'
  }
];

export const TechnicalSupportSection: TechnicalSupportData = {
  sectionTitle: "Technical Support",
  sectionDescription: "Comprehensive support for seamless learning experience",
  tagline: "Installation help • Code reviews • Debugging assistance • 24/7 support",
  features: technicalFeatures,
  supportChannels: supportChannels
};



export const allCourses: Course[] = [
  {
    id: 4,
    category: "Data Science & AI",
    format: "LIVE ONLINE",
    title: "Data Analyst",
    description:
      "Analyze, visualize & communicate insights from data effectively using SQL and BI tools.",
    features: [
      "SQL & Database Queries",
      "Data Visualization",
      "Statistical Analysis",
      "Business Intelligence",
      "Python",
      "Excel"
    ],
    image: "/Fourth.webp",
    slug: "data-analyst",
    icon: FaChartLine,
    heroTitle: "Data Analyst with AI & ML Integration",
    heroSubtitle: "with AI & ML Integration",
    heroDescription: "Master Python, SQL, Tableau, Power BI, Machine Learning & cutting-edge AI tools.",
    heroSubDescription: "Build production-grade dashboards and land high-paying jobs at top companies.",

    // Add stats specific to Data Analyst course
    companies: ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },

    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: 'Weekly Assignments',
          description: 'Data analysis tasks and exercises after each concept to reinforce learning',
          features: [
            'Weekly Data Challenges',
            'Automated Evaluation',
            'Progress Tracking'
          ],
          backContent: {
            points: [
              'Data cleaning and preprocessing tasks',
              'SQL query challenges',
              'Python data analysis exercises',
              'Dashboard creation assignments',
              'Real-world dataset analysis'
            ],
            frequency: 'Every Week',
            weightage: '20% of final grade'
          }
        },
        {
          id: 1,
          title: 'Module Assessments',
          description: 'Comprehensive assessments for each module to validate understanding',
          features: [
            'SQL + Python Challenges',
            'Dashboard Creation',
            'Detailed Analytics Reports'
          ],
          backContent: {
            points: [
              'SQL query optimization tests',
              'Python data analysis challenges',
              'Dashboard design evaluation',
              'Business insight generation',
              'Statistical analysis validation'
            ],
            frequency: 'After Each Module',
            weightage: '30% of final grade'
          }
        },
        {
          id: 2,
          title: 'Project Evaluations',
          description: 'Comprehensive review of data analytics projects with detailed feedback',
          features: [
            'Data Pipeline Review',
            'Dashboard UX/UI Check',
            'Business Insights Validation'
          ],
          backContent: {
            points: [
              'Data pipeline architecture evaluation',
              'Dashboard design and usability assessment',
              'Business insight accuracy check',
              'Visualization best practices review',
              'Storytelling effectiveness evaluation'
            ],
            frequency: 'Per Project',
            weightage: '40% of final grade'
          }
        },
        {
          id: 3,
          title: 'Certification Benefits',
          description: 'Industry-recognized certificate with global recognition',
          features: [
            'Industry Recognized',
            'Global Validity',
            'Hiring Partner Access'
          ],
          backContent: {
            points: [
              'Industry-recognized certificate',
              'Global recognition',
              'Hiring partner acceptance',
              'Decisions network access',
              'Verified data analytics skills'
            ],
            frequency: 'Program Completion',
            weightage: 'Official Certification'
          }
        }
      ],
      certificateData: {
        title: 'Industry-Recognized Certification',
        description: 'Our certificate validates your data analytics skills and demonstrates your competency to employers worldwide.',
        benefits: [
          'Industry-recognized certificate',
          'Global recognition and validity',
          'Hiring partner acceptance',
          'Decisions network access',
          'Verified by industry experts',
          'Includes digital badge for LinkedIn'
        ],
        certificateDetails: {
          title: 'Certificate of Completion',
          subtitle: 'Data Analytics & Business Intelligence',
          subSubtitle: 'Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.',
          rating: 5
        }
      }
    },

    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6–8 Months • 500–600 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Data Fundamentals & Excel",
          icon: "FileSpreadsheet",
          duration: "6-8 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-200 to-indigo-200",
          borderColor: "border-blue-700",
          topics: [
            {
              title: "Excel Mastery (3-4 Weeks)",
              color: "blue-500",
              items: [
                "Advanced formulas and functions",
                "Data cleaning and preprocessing",
                "Pivot tables and data summarization",
                "Advanced charting and visualization",
                "What-if analysis and scenario manager",
                "Power Query for data transformation",
                "Dashboard creation"
              ]
            },
            {
              title: "Statistics for Data Analysis (3-4 Weeks)",
              color: "indigo-500",
              items: [
                "Descriptive statistics",
                "Probability distributions",
                "Hypothesis testing",
                "Correlation and regression",
                "ANOVA and chi-square tests",
                "Statistical inference"
              ]
            }
          ],
          projects: [
            {
              title: "Mini Project:",
              description: "Sales Performance Dashboard",
              color: "blue"
            },
            {
              title: "Mini Project:",
              description: "Statistical Analysis of Business Dataset",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "SQL & Database Management",
          icon: "Database",
          duration: "6-7 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "SQL Fundamentals (3-4 Weeks)",
              color: "green-500",
              items: [
                "Database design and normalization",
                "SELECT statements and filtering",
                "JOIN operations and subqueries",
                "Aggregate functions and GROUP BY",
                "Window functions and CTEs",
                "Data modification and transactions"
              ]
            },
            {
              title: "Advanced SQL & Database Systems (3-4 Weeks)",
              color: "emerald-500",
              items: [
                "Stored procedures and functions",
                "Query optimization and indexing",
                "Working with NoSQL databases",
                "Data warehousing concepts",
                "ETL processes",
                "Database administration basics"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Complex Business Queries for Real Database",
              color: "green"
            },
            {
              title: "Project 2:",
              description: "Data Warehouse Implementation",
              color: "emerald"
            }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Python for Data Analysis",
          icon: "Code",
          duration: "8-10 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Python Fundamentals (3-4 Weeks)",
              color: "purple-500",
              items: [
                "Python syntax and data types",
                "Control structures and functions",
                "Object-oriented programming",
                "File handling and modules",
                "Error handling and debugging",
                "Working with APIs"
              ]
            },
            {
              title: "Data Analysis with Pandas & NumPy (5-6 Weeks)",
              color: "violet-500",
              items: [
                "NumPy arrays and operations",
                "Pandas DataFrames and Series",
                "Data cleaning and preprocessing",
                "Data aggregation and grouping",
                "Time series analysis",
                "Data merging and joining"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Data Processing Script with Error Handling",
              color: "purple"
            },
            {
              title: "Project 2:",
              description: "Comprehensive Data Analysis of e-commerce Dataset",
              color: "violet"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Data Visualization with Python",
          icon: "BarChart",
          duration: "4-5 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "Data Visualization Libraries (4-5 Weeks)",
              color: "orange-500",
              items: [
                "Matplotlib for basic plotting",
                "Seaborn for statistical visualization",
                "Plotly for interactive charts",
                "Geospatial visualization",
                "Dashboard building with Dash",
                "Best practices in data visualization"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Project:",
              description: "Interactive Dashboard for Business Metrics",
              color: "orange"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "Business Intelligence & Visualization",
          icon: "PieChart",
          duration: "6-8 Weeks",
          gradient: "from-red-500 to-pink-600",
          bgColor: "bg-gradient-to-br from-red-50 to-pink-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Tableau for Visualization (3-4 Weeks)",
              color: "red-500",
              items: [
                "Tableau interface and worksheet",
                "Connecting to various data sources",
                "Creating basic and advanced charts",
                "Calculated fields and parameters",
                "Dashboard design and layout",
                "Story points and presentation"
              ]
            },
            {
              title: "Power BI Mastery (3-4 Weeks)",
              color: "pink-500",
              items: [
                "Power BI desktop and service",
                "Data modeling and relationships",
                "DAX formulas and measures",
                "Advanced visualization techniques",
                "Power Query for ETL",
                "Report publishing and sharing"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Sales Performance Dashboard in Tableau",
              color: "red"
            },
            {
              title: "Project 2:",
              description: "Customer Dashboard in Power BI",
              color: "pink"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Machine Learning & AI for Data Analysis",
          icon: "Brain",
          duration: "8-10 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "Machine Learning Fundamentals (5-6 Weeks)",
              color: "teal-500",
              items: [
                "Supervised vs unsupervised learning",
                "Linear and logistic regression",
                "Decision trees and random forests",
                "Clustering algorithms",
                "Model evaluation and validation",
                "Feature engineering and selection"
              ]
            },
            {
              title: "Advanced ML & AI Integration (3-4 Weeks)",
              color: "cyan-500",
              items: [
                "Natural Language Processing (NLP)",
                "Time series forecasting",
                "Neural networks and deep learning",
                "Model deployment and monitoring",
                "AI-powered analytics",
                "MLOps fundamentals"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Customer Churn Prediction Model",
              color: "teal"
            },
            {
              title: "Project 2:",
              description: "Sales Forecasting with ML",
              color: "cyan"
            }
          ]
        },
        {
          id: 6,
          title: "Phase 7",
          subtitle: "Capstone Projects & Interview Preparation",
          icon: "Rocket",
          duration: "4-6 Weeks",
          gradient: "from-yellow-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-yellow-50 to-amber-50",
          borderColor: "border-yellow-200",
          topics: [
            {
              title: "Capstone Project Development (2-3 Weeks)",
              color: "yellow-500",
              items: [
                "End-to-end data analysis project",
                "Real-world business problem solving",
                "Data pipeline development",
                "Dashboard and report creation",
                "Presentation and storytelling",
                "Project documentation"
              ]
            },
            {
              title: "Interview Preparation (1-2 Weeks)",
              color: "amber-500",
              items: [
                "SQL interview questions",
                "Python coding challenges",
                "Statistics and probability questions",
                "Case study business problems",
                "Behavioral interview preparation",
                "Resume building and LinkedIn optimization"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Outcome:",
              description: "Production-ready data analysis project",
              color: "yellow"
            },
            {
              title: "Interview Outcome:",
              description: "Crack technical interviews at top companies",
              color: "amber"
            }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "Sales Performance Dashboard",
          description: "Interactive dashboard with sales metrics, customer insights, and revenue performance tracking",
          icon: "BarChart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Excel", "Tableau", "SQL", "Dashboard", "Business Intelligence"]
        },
        {
          id: 1,
          title: "E-commerce Analytics Platform",
          description: "Comprehensive analysis of customer behavior, sales trends, and inventory optimization with predictive models",
          icon: "ShoppingCart",
          gradient: "from-emerald-500 to-teal-500",
          bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
          borderColor: "border-emerald-200",
          tags: ["Python", "Pandas", "SQL", "ML", "Tableau"]
        },
        {
          id: 2,
          title: "Healthcare Data Analysis",
          description: "Patient outcomes analysis, treatment effectiveness, and hospital performance metrics with visualization",
          icon: "Stethoscope",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Python", "SQL", "Power BI", "Statistics", "Healthcare"]
        },
        {
          id: 3,
          title: "Customer Churn Prediction",
          description: "Machine learning models to predict customer churn with feature importance analysis and business recommendations",
          icon: "Users",
          gradient: "from-amber-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
          borderColor: "border-amber-200",
          tags: ["Python", "Scikit-learn", "ML", "SQL", "Business Analytics"]
        },
        {
          id: 4,
          title: "Financial Market Analysis",
          description: "Stock price prediction, portfolio optimization, and risk forecasting with time series analysis",
          icon: "TrendingUp",
          gradient: "from-indigo-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
          borderColor: "border-indigo-200",
          tags: ["Python", "Pandas", "Time Series", "Finance", "ML"]
        },
        {
          id: 5,
          title: "Social Media Sentiment Analysis",
          description: "NLP-based sentiment analysis of social media data to understand brand perception and collective sentiment",
          icon: "MessageSquare",
          gradient: "from-rose-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
          borderColor: "border-rose-200",
          tags: ["Python", "NLP", "Text Analysis", "Sentiment", "AI"]
        }
      ],
      techStack: [
        {
          category: "Data Analysis Tools",
          icon: "BarChart",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Python", iconSrc: "/DAT1.webp" },
            { label: "SQL", iconSrc: "/DAT2.webp" },
            { label: "Excel", iconSrc: "/DAT3.webp" },
            { label: "Statistics", iconSrc: "/DAT4.webp" },
            { label: "Pandas", iconSrc: "/DAT5.webp" },
            { label: "NumPy", iconSrc: "/DAT6.webp" }
          ]
        },
        {
          category: "Visualization Tools",
          icon: "PieChart",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "Tableau", iconSrc: "/VT1.webp" },
            { label: "Power BI", iconSrc: "/VT2.webp" },
            { label: "Matplotlib", iconSrc: "/VT3.svg" },
            { label: "Seaborn", iconSrc: "/VT4.webp" },
            { label: "Plotly", iconSrc: "/VT5.webp" },
            { label: "Dash", iconSrc: "/VT6.webp" }
          ]
        },
        {
          category: "Database & Cloud",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "PostgreSQL", iconSrc: "/DC2.webp" },
            { label: "MongoDB", iconSrc: "/DC3.webp" },
            { label: "AWS", iconSrc: "/DC4.webp" },
            { label: "Google Cloud", iconSrc: "/DC5.webp" },
            { label: "Azure", iconSrc: "/DC6.webp" }
          ]
        },
        {
          category: "AI & ML Tools",
          icon: "Brain",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "Scikit-learn", iconSrc: "/ML1.webp" },
            { label: "TensorFlow", iconSrc: "/ML2.webp" },
            { label: "PyTorch", iconSrc: "/ML3.webp" },
            { label: "NLTK", iconSrc: "/ML4.webp" },
            { label: "spaCy", iconSrc: "/ML5.webp" },
            { label: "Hugging Face", iconSrc: "/ML6.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Data Analyst",
          salary: "$65k–$110k",
          icon: "BarChart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Analyze data, create reports, and provide business insights using SQL, Python, and BI tools."
        },
        {
          title: "Business Intelligence Analyst",
          salary: "$70k–$120k",
          icon: "PieChart",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Design and implement BI solutions, dashboards, and data visualization systems."
        },
        {
          title: "Data Scientist",
          salary: "$85k–$140k",
          icon: "Brain",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Build predictive models, perform advanced analytics, and derive insights from complex datasets."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["End-to-end Data Analysis", "Real Business Problem", "Complete Data Pipeline"],
        outcome: "Production-ready data analytics project with full documentation"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["SQL Queries", "Python Coding", "Statistics & Probability", "Case Studies"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack data analyst interviews at top companies"
      }
    }
  },
  {
    id: 12,
    category: "Data Science & AI",
    format: "LIVE ONLINE",
    title: "Data Science & AI Mastery Bootcamp",
    description:
      "Master Python, Machine Learning, Deep Learning, NLP, Computer Vision & MLOps. Build production-grade AI applications and land high-paying jobs at top tech companies.",
    features: [
      "Machine Learning",
      "Deep Learning",
      "NLP & Computer Vision",
      "Statistics & ML Foundations",
      "Advanced AI Techniques",
      "MLOps & Deployment"
    ],
    image: "/T.webp", // You'll need to create/use this image
    slug: "data-science-ai-bootcamp",
    icon: FaBrain,

    // Hero Section Data
    heroTitle: "Data Science & AI Mastery Bootcamp",
    heroSubtitle: "with ML, Deep Learning & MLOps",
    heroDescription: "Master Python, Statistics, Machine Learning, Deep Learning, NLP, Computer Vision, MLOps & cutting-edge AI tools.",
    heroSubDescription: "Build production-grade AI applications and land high-paying jobs at top tech companies.",


    companies: ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro", "Meta", "Netflix"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },

    // Assessment & Certification Data
    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: 'Weekly Assignments',
          description: 'Hands-on data science tasks and exercises after each concept to reinforce learning',
          features: [
            'Weekly Data Challenges',
            'Automated Evaluation',
            'Progress Tracking'
          ],
          backContent: {
            points: [
              'Python coding and data manipulation exercises',
              'Statistical analysis tasks',
              'ML model implementation challenges',
              'Data visualization assignments',
              'Real-world dataset analysis'
            ],
            frequency: 'Every Week',
            weightage: '20% of final grade'
          }
        },
        {
          id: 1,
          title: 'Module Assessments',
          description: 'Comprehensive assessments for each module to validate understanding',
          features: [
            'Statistics + ML Challenges',
            'Python Coding Tests',
            'Detailed Analytics Reports'
          ],
          backContent: {
            points: [
              'Statistical hypothesis testing',
              'Machine learning algorithm implementation',
              'Python data science libraries proficiency',
              'Model evaluation and validation',
              'Data preprocessing and feature engineering'
            ],
            frequency: 'After Each Module',
            weightage: '30% of final grade'
          }
        },
        {
          id: 2,
          title: 'Project Evaluations',
          description: 'Comprehensive review of data science projects with detailed feedback',
          features: [
            'ML Pipeline Review',
            'Model Performance Check',
            'Deployment Readiness'
          ],
          backContent: {
            points: [
              'End-to-end ML pipeline evaluation',
              'Model performance and accuracy assessment',
              'Code quality and best practices review',
              'Deployment readiness evaluation',
              'Documentation and presentation assessment'
            ],
            frequency: 'Per Project',
            weightage: '40% of final grade'
          }
        },
        {
          id: 3,
          title: 'Certification Benefits',
          description: 'Industry-recognized data science certificate with global recognition',
          features: [
            'Industry Recognized',
            'Global Validity',
            'Hiring Partner Access'
          ],
          backContent: {
            points: [
              'Industry-recognized data science certificate',
              'Global recognition and validity',
              'Hiring partner acceptance',
              'Alumni network access',
              'Verified data science and AI skills'
            ],
            frequency: 'Program Completion',
            weightage: 'Official Certification'
          }
        }
      ],
      certificateData: {
        title: 'Industry-Recognized Data Science Certification',
        description: 'Our certificate validates your data science and AI skills and demonstrates your competency to employers worldwide. It showcases your ability to build production-grade AI applications.',
        benefits: [
          'Industry-recognized certificate',
          'Global recognition and validity',
          'Hiring partner acceptance',
          'Alumni network access',
          'Verified by industry experts',
          'Includes digital badge for LinkedIn'
        ],
        certificateDetails: {
          title: 'Certificate of Completion',
          subtitle: 'Data Science & AI Mastery',
          subSubtitle: 'Covering Python, Machine Learning, Deep Learning, Data Visualization, Statistics, Artificial Intelligence, Predictive Modeling, and Real-World Data Science Projects.',
          rating: 5
        }
      }
    },

    // Comprehensive Curriculum Data
    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6–8 Months • 600–700 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Python Fundamentals & Data Analysis",
          icon: "Code",
          duration: "6-8 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-200 to-indigo-200",
          borderColor: "border-blue-700",
          topics: [
            {
              title: "Python Programming Essentials (3-4 Weeks)",
              color: "blue-500",
              items: [
                "Python installation, IDEs (VS Code, PyCharm)",
                "Data types, variables, operators, control structures",
                "Functions, modules, and object-oriented programming",
                "Exception handling and debugging",
                "File I/O and data serialization",
                "Essential libraries: NumPy, Pandas, Matplotlib"
              ]
            },
            {
              title: "Data Analysis & Visualization (3-4 Weeks)",
              color: "indigo-500",
              items: [
                "Pandas for data manipulation and cleaning",
                "Data visualization with Matplotlib and Seaborn",
                "Exploratory Data Analysis (EDA) techniques",
                "Statistical analysis and hypothesis testing",
                "Working with different data formats (CSV, JSON, Excel)",
                "Web scraping with BeautifulSoup and Requests"
              ]
            }
          ],
          projects: [
            {
              title: "Mini Project:",
              description: "Data analysis of real-world datasets (Sales, Weather, etc.)",
              color: "blue"
            },
            {
              title: "Main Project:",
              description: "Comprehensive EDA on a real-world dataset with insights",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Statistics & Machine Learning Foundations",
          icon: "BarChart",
          duration: "8-10 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Statistics for Data Science (4-5 Weeks)",
              color: "green-500",
              items: [
                "Descriptive statistics and probability theory",
                "Probability distributions and their applications",
                "Statistical inference and hypothesis testing",
                "Correlation and regression analysis",
                "Bayesian statistics fundamentals",
                "A/B testing and experimental design"
              ]
            },
            {
              title: "Machine Learning Fundamentals (4-5 Weeks)",
              color: "emerald-500",
              items: [
                "Linear and logistic regression",
                "Decision trees and ensemble methods (Random Forest, XGBoost)",
                "Clustering algorithms (K-Means, Hierarchical, DBSCAN)",
                "Model evaluation and validation techniques",
                "Feature engineering and selection",
                "Cross-validation and hyperparameter tuning",
                "Introduction to Scikit-learn"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Statistical analysis of business problems",
              color: "green"
            },
            {
              title: "Project 2:",
              description: "End-to-end ML pipeline for classification/regression problem",
              color: "emerald"
            }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Advanced Machine Learning & Deep Learning",
          icon: "Brain",
          duration: "8-10 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Advanced ML Algorithms (4-5 Weeks)",
              color: "purple-500",
              items: [
                "Support Vector Machines (SVM)",
                "Principal Component Analysis (PCA)",
                "Gradient Boosting algorithms (LightGBM, CatBoost)",
                "Time series analysis and forecasting",
                "Recommendation systems",
                "Anomaly detection techniques",
                "Model interpretability (SHAP, LIME)"
              ]
            },
            {
              title: "Deep Learning Fundamentals (4-5 Weeks)",
              color: "violet-500",
              items: [
                "Neural networks fundamentals",
                "TensorFlow and Keras for deep learning",
                "PyTorch fundamentals",
                "Convolutional Neural Networks (CNNs)",
                "Recurrent Neural Networks (RNNs, LSTMs)",
                "Transfer learning and fine-tuning",
                "Hyperparameter optimization for neural networks"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Time series forecasting or recommendation system",
              color: "purple"
            },
            {
              title: "Project 2:",
              description: "Image classification or text generation with deep learning",
              color: "violet"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Natural Language Processing & Computer Vision",
          icon: "Eye",
          duration: "8-10 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "Natural Language Processing (4-5 Weeks)",
              color: "orange-500",
              items: [
                "Text preprocessing and tokenization",
                "TF-IDF and word embeddings (Word2Vec, GloVe)",
                "Transformer architecture and BERT",
                "Sentiment analysis and text classification",
                "Named Entity Recognition (NER)",
                "Text generation with GPT models",
                "Hugging Face Transformers library"
              ]
            },
            {
              title: "Computer Vision (4-5 Weeks)",
              color: "amber-500",
              items: [
                "Image processing fundamentals",
                "Object detection (YOLO, SSD)",
                "Image segmentation (U-Net, Mask R-CNN)",
                "Generative Adversarial Networks (GANs)",
                "Face recognition and analysis",
                "Optical Character Recognition (OCR)",
                "Video analysis and processing"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Sentiment analysis or text classification system",
              color: "orange"
            },
            {
              title: "Project 2:",
              description: "Object detection or image segmentation application",
              color: "amber"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "MLOps & Deployment",
          icon: "Cloud",
          duration: "6-8 Weeks",
          gradient: "from-red-500 to-pink-600",
          bgColor: "bg-gradient-to-br from-red-50 to-pink-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "MLOps Fundamentals (3-4 Weeks)",
              color: "red-500",
              items: [
                "Model versioning and experiment tracking (MLflow)",
                "Docker containerization for ML",
                "Model deployment strategies",
                "CI/CD for machine learning",
                "Model monitoring and maintenance",
                "Feature stores and data versioning"
              ]
            },
            {
              title: "Cloud Deployment (3-4 Weeks)",
              color: "pink-500",
              items: [
                "Deploy ML applications to cloud platforms",
                "AWS SageMaker for model deployment",
                "Google AI Platform deployment",
                "Azure Machine Learning deployment",
                "Serverless deployment with AWS Lambda",
                "Model serving with TensorFlow Serving",
                "Building ML web applications with Streamlit"
              ]
            }
          ],
          projects: [
            {
              title: "Project:",
              description: "Deploy complete ML pipeline to cloud",
              color: "pink"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Capstone Projects & Interview Preparation",
          icon: "Rocket",
          duration: "6-8 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "Capstone Project Development (4-5 Weeks)",
              color: "teal-500",
              items: [
                "End-to-end data science project execution",
                "Computer vision application development",
                "NLP or text analysis system",
                "Time series forecasting application",
                "Recommendation engine implementation",
                "Anomaly detection system",
                "Agile development methodology"
              ]
            },
            {
              title: "Interview Preparation (2-3 Weeks)",
              color: "cyan-500",
              items: [
                "Statistics and probability questions",
                "Machine learning theory and concepts",
                "Coding challenges on LeetCode, HackerRank",
                "Case study and business problems",
                "System design for ML systems",
                "Resume building and LinkedIn optimization",
                "Mock interviews and feedback"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Outcome:",
              description: "Production-ready data science application",
              color: "teal"
            },
            {
              title: "Interview Outcome:",
              description: "Crack data science interviews at top companies",
              color: "cyan"
            }
          ]
        }
      ],

      // Portfolio Projects Section
      projects: [
        {
          id: 0,
          title: "Medical Image Analysis System",
          description: "Deep learning application for medical image classification and segmentation with high accuracy",
          icon: "Stethoscope",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Deep Learning", "Computer Vision", "Healthcare", "TensorFlow", "Python"]
        },
        {
          id: 1,
          title: "Autonomous Vehicle Object Detection",
          description: "Real-time object detection system for autonomous vehicles using YOLO and computer vision",
          icon: "Car",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          tags: ["Computer Vision", "Real-time", "YOLO", "Deep Learning", "Python"]
        },
        {
          id: 2,
          title: "Fraud Detection System",
          description: "Machine learning system for real-time fraud detection in financial transactions",
          icon: "Shield",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Machine Learning", "Real-time", "Finance", "Anomaly Detection", "Python"]
        },
        {
          id: 3,
          title: "E-commerce Recommendation Engine",
          description: "Personalized product recommendation system using collaborative filtering and content-based approaches",
          icon: "ShoppingCart",
          gradient: "from-orange-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          tags: ["Machine Learning", "Recommendation Systems", "E-commerce", "Python"]
        },
        {
          id: 4,
          title: "Social Media Sentiment Analysis",
          description: "Real-time sentiment analysis of social media posts with interactive dashboards and visualizations",
          icon: "MessageSquare",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          tags: ["NLP", "Sentiment Analysis", "Social Media", "Python", "Dashboard"]
        },
        {
          id: 5,
          title: "COVID-19 Spread Prediction",
          description: "Time series forecasting model for COVID-19 spread with interactive visualization",
          icon: "Activity",
          gradient: "from-indigo-500 to-violet-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-violet-50",
          borderColor: "border-indigo-200",
          tags: ["Time Series", "Forecasting", "Healthcare", "Python", "Visualization"]
        },
        {
          id: 6,
          title: "Credit Risk Assessment Model",
          description: "Machine learning model for credit risk assessment with explainable AI techniques",
          icon: "TrendingUp",
          gradient: "from-teal-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          tags: ["Machine Learning", "Finance", "Risk Assessment", "XAI", "Python"]
        },
        {
          id: 7,
          title: "Multilingual Text Translation",
          description: "Neural machine translation system for multiple languages using transformer models",
          icon: "Globe",
          gradient: "from-yellow-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-yellow-50 to-amber-50",
          borderColor: "border-yellow-200",
          tags: ["NLP", "Translation", "Transformers", "Deep Learning", "Python"]
        }
      ],

      // Tech Stack Section
      techStack: [
        {
          category: "Programming & Core Libraries",
          icon: "Code",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Python", iconSrc: "/DAT1.webp" },
            { label: "NumPy", iconSrc: "/DAT6.webp" },
            { label: "Pandas", iconSrc: "/DAT5.webp" },
            { label: "Matplotlib", iconSrc: "/DDW5.svg" },
            { label: "Seaborn", iconSrc: "/VT4.webp" },
            { label: "Scikit-learn", iconSrc: "/ML1.webp" }
          ]
        },
        {
          category: "Machine Learning Frameworks",
          icon: "Brain",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "TensorFlow", iconSrc: "/ML2.webp" },
            { label: "PyTorch", iconSrc: "/ML3.webp" },
            { label: "Keras", iconSrc: "/MLF3.webp" },
            { label: "XGBoost", iconSrc: "/MLF4.webp" },
            { label: "LightGBM", iconSrc: "/MLF5.webp" },
            { label: "CatBoost", iconSrc: "/MLF6.webp" }
          ]
        },
        {
          category: "Data & Deployment",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "Kubernetes", iconSrc: "/DP3.webp" },
            { label: "Streamlit", iconSrc: "/Data4.webp" },
            { label: "AWS SageMaker", iconSrc: "/CP1.webp" },
            { label: "MLflow", iconSrc: "/AI1.webp" }
          ]
        },
        {
          category: "Advanced AI & Specialized Tools",
          icon: "Cpu",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "OpenAI", iconSrc: "/AI1.webp" },
            { label: "Hugging Face", iconSrc: "/AI2.webp" },
            { label: "LangChain", iconSrc: "/AI3.webp" },
            { label: "Transformers", iconSrc: "/AI4.webp" },
            { label: "TensorBoard", iconSrc: "/AI5.webp" },
            { label: "FastAPI", iconSrc: "/AI6.webp" }
          ]
        }
      ],

      // Career Outcomes
      careerOutcomes: [
        {
          title: "Data Scientist",
          salary: "$85k–$140k",
          icon: "Brain",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Build predictive models, perform advanced analytics, and derive insights from complex datasets."
        },
        {
          title: "Machine Learning Engineer",
          salary: "$90k–$150k",
          icon: "Cpu",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Design, build, and deploy machine learning models and systems at scale."
        },
        {
          title: "AI/ML Specialist",
          salary: "$95k–$160k",
          icon: "Zap",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Focus on advanced AI techniques like NLP, Computer Vision, and Deep Learning applications."
        }
      ],

      // Capstone Data
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["End-to-end Data Science Project", "Real Business Problem", "Complete ML Pipeline"],
        outcome: "Production-ready AI/ML application with full documentation and deployment"
      },

      // Interview Prep
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["Statistics & Probability", "ML Algorithms", "Coding Challenges", "System Design"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Portfolio Presentation", "Salary Negotiation"],
        outcome: "Crack data science interviews at top tech companies"
      }
    }
  },
  {
    id: 11,
    category: "Development",
    format: "LIVE ONLINE",
    title: "Full Stack Java",
    description:
      "Master enterprise Java development with Spring Boot and modern frontend tools.",
    features: [
      "Spring Boot & Microservices",
      "Hibernate & JPA",
      "REST APIs",
      "Security"
    ],
    image: "/E.webp",
    slug: "full-stack-java",
    icon: FaCode,
    heroTitle: "Full Stack Java Developer",
    heroSubtitle: "with AI Integration",
    heroDescription: "Master Java, Spring Boot, React, Microservices, Docker, AWS & cutting-edge AI/ML integration.",
    heroSubDescription: "Build production-grade applications and land high-paying jobs at top tech companies.",
    // ADD ASSESSMENT DATA HERE
    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: 'Weekly Assignments',
          description: 'Hands-on coding tasks and exercises after each concept to reinforce learning',
          features: [
            'Weekly Evaluations',
            'Automated Testing',
            'Progress Tracking'
          ],
          backContent: {
            points: [
              'Hands-on coding tasks and exercises',
              'Coding exercises after every module',
              'Progress tracking dashboard',
              'Automated test case evaluation',
              'Real-world problem solving'
            ],
            frequency: 'Every Week',
            weightage: '20% of final grade'
          }
        },
        {
          id: 1,
          title: 'Module Assessments',
          description: 'Comprehensive assessments for each module to validate understanding',
          features: [
            'MCQ + Coding Challenges',
            'Skill Gap Analysis',
            'Detailed Reports'
          ],
          backContent: {
            points: [
              'MCQ + coding challenges',
              'Problem-solving assessments',
              'Detailed performance reports',
              'Skill gap analysis',
              'Module Tests validation'
            ],
            frequency: 'After Each Module',
            weightage: '30% of final grade'
          }
        },
        {
          id: 2,
          title: 'Project Evaluations',
          description: 'Comprehensive review of real-world projects with detailed feedback',
          features: [
            'Architecture Review',
            'Best Practices Check',
            'Deployment Ready'
          ],
          backContent: {
            points: [
              'Architecture evaluation',
              'Best practices assessment',
              'Deployment readiness check',
              'Performance optimization tips',
              'Code quality and functionality testing'
            ],
            frequency: 'Per Project',
            weightage: '40% of final grade'
          }
        },
        {
          id: 3,
          title: 'Certification Benefits',
          description: 'Industry-recognized certificate with global recognition',
          features: [
            'Industry Recognized',
            'Global Validity',
            'Hiring Partner Access'
          ],
          backContent: {
            points: [
              'Industry-recognized certificate',
              'Global recognition',
              'Hiring partner acceptance',
              'Decisions network access',
              'Verified skills validation'
            ],
            frequency: 'Program Completion',
            weightage: 'Official Certification'
          }
        }
      ],
      certificateData: {
        title: 'Industry-Recognized Certification',
        description: 'Our certificate validates your skills and demonstrates your competency to employers worldwide. It\'s not just a piece of paper—it\'s proof of your ability to build real-world applications.',
        benefits: [
          'Industry-recognized certificate',
          'Global recognition and validity',
          'Hiring partner acceptance',
          'Decisions network access',
          'Verified by industry experts',
          'Includes digital badge for LinkedIn'
        ],
        certificateDetails: {
          title: 'Certificate of Completion',
          subtitle: 'Full-Stack Development',
          subSubtitle: 'Covering Java, Spring Boot, REST APIs, Microservices, Database Management, Frontend Development, AI Integration, Cloud Deployment, and Real-World Full Stack AI Application Projects.',
          rating: 5
        }
      }
    },

    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6–8 Months • 600–700 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Java Fundamentals & Core Concepts",
          icon: "Code",
          duration: "8-10 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-200 to-indigo-200",
          borderColor: "border-blue-700",
          topics: [
            {
              title: "Java Basics (4–5 Weeks)",
              color: "blue-500",
              items: [
                "Java Installation, JDK setup, IntelliJ / Eclipse",
                "OOP: Classes, Objects, Inheritance, Polymorphism",
                "Collections Framework (List, Set, Map, Queue)",
                "Java 8+: Lambda, Streams"
              ]
            },
            {
              title: "Advanced Java (4–5 Weeks)",
              color: "indigo-500",
              items: [
                "SOLID + Clean Code",
                "Design Patterns: Singleton, Factory, Builder, Observer",
                "JDBC + DB Connectivity",
                "JUnit, Mockito Testing"
              ]
            }
          ],
          projects: [
            {
              title: "Mini Project:",
              description: "Console-based application (Library/Banking System)",
              color: "blue"
            },
            {
              title: "Advanced Project:",
              description: "Multithreaded Application + DB Integration",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Backend Development with Spring",
          icon: "Server",
          duration: "6-7 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Spring Framework Core (3–4 Weeks)",
              color: "green-500",
              items: [
                "Dependency Injection, IoC",
                "Spring Boot Auto Config",
                "MVC Architecture, REST API Design",
                "Validation + Exception Handling"
              ]
            },
            {
              title: "Database & Persistence (3–4 Weeks)",
              color: "emerald-500",
              items: [
                "MySQL / PostgreSQL, Hibernate + JPA",
                "Entity Relations (One-To-One, Many-To-Many)",
                "NoSQL (MongoDB), Caching with Redis"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "E-commerce REST API",
              color: "green"
            },
            {
              title: "Project 2:",
              description: "Multi-Entity Database Application",
              color: "emerald"
            },
            {
              title: "Project 3:",
              description: "Secure Microservices Architecture",
              color: "teal"
            }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Frontend Development",
          icon: "Globe",
          duration: "6-7 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Web Fundamentals (3 Weeks)",
              color: "purple-500",
              items: [
                "HTML5 + SEO + Accessibility",
                "CSS Flex, Grid, Animations",
                "JavaScript ES6+, Fetch API, async/await"
              ]
            },
            {
              title: "React.js Fundamentals (3–4 Weeks)",
              color: "violet-500",
              items: [
                "JSX, Props, State, Hooks",
                "React Router v6, Redux Toolkit",
                "Axios + React Query, Forms + Validation"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Multi-page Responsive Website",
              color: "purple"
            },
            {
              title: "Project 2:",
              description: "Full-featured E-Commerce SPA",
              color: "violet"
            },
            {
              title: "Capstone:",
              description: "Social Media Dashboard / Real-Time App",
              color: "fuchsia"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "DevOps, Cloud & Deployment",
          icon: "Cloud",
          duration: "4-5 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "DevOps Essentials (2–3 Weeks)",
              color: "orange-500",
              items: [
                "Linux Commands, Docker & Docker Compose",
                "CI/CD — GitHub Actions",
                "Kubernetes Basics, Monitoring (ELK)"
              ]
            },
            {
              title: "Cloud Deployment (2–3 Weeks)",
              color: "amber-500",
              items: [
                "AWS: EC2, S3, RDS, Elastic Beanstalk",
                "MongoDB Atlas, Environment Variables"
              ]
            }
          ],
          projects: [
            {
              title: "Outcome:",
              description: "CI/CD + Container Deployment",
              color: "orange"
            },
            {
              title: "Project:",
              description: "Deploy Full-Stack App to Cloud",
              color: "amber"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "AI Integration with Java",
          icon: "Brain",
          duration: "4-5 Weeks",
          gradient: "from-pink-500 to-rose-600",
          bgColor: "bg-gradient-to-br from-pink-50 to-rose-50",
          borderColor: "border-pink-200",
          topics: [
            {
              title: "AI / ML Fundamentals (2 Weeks)",
              color: "pink-500",
              items: [
                "AI / ML Basics, DL4J, WEKA, Tribuo",
                "Model Training / Inference, Python Bridge (optional)"
              ]
            },
            {
              title: "AI Integration via APIs (2–3 Weeks)",
              color: "rose-500",
              items: [
                "OpenAI, Claude, Gemini, HF API",
                "Vertex AI / Sagemaker, Chatbots / Summarizers"
              ]
            }
          ],
          projects: [
            {
              title: "Outcome:",
              description: "Understand ML, Model Lifecycle",
              color: "pink"
            },
            {
              title: "Project 1:",
              description: "AI Powered Support Bot",
              color: "rose"
            },
            {
              title: "Capstone:",
              description: "Resume Analyzer with RAG",
              color: "red"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "Capstone & Interview Prep",
          icon: "Rocket",
          duration: "4-6 Weeks",
          gradient: "from-red-500 to-orange-600",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Capstone Project Development (2–3 Weeks)",
              color: "red-500",
              items: [
                "AI-Ecommerce Platform",
                "Healthcare Management System",
                "Intelligent Job Portal",
                "Financial Analytics Dashboard"
              ]
            },
            {
              title: "Interview Preparation (1–2 Weeks)",
              color: "orange-500",
              items: [
                "DSA + LeetCode",
                "System Design",
                "Java, Spring, Collections",
                "Resume & LinkedIn",
                "Mock Interviews",
                "Salary Negotiation"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Outcome:",
              description: "Full-Stack Production App",
              color: "red"
            },
            {
              title: "Interview Outcome:",
              description: "Crack Product-Based Interviews",
              color: "orange"
            }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "E-Commerce Platform with Recommendation Engine",
          description: "Full-stack + AI-powered product recommendations",
          icon: "ShoppingCart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Java", "Spring Boot", "React", "MySQL", "AI/ML"]
        },
        {
          id: 1,
          title: "AI-Powered Financial Analytics Dashboard",
          description: "Predictive analytics + real-time data",
          icon: "LineChart",
          gradient: "from-emerald-500 to-teal-500",
          bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
          borderColor: "border-emerald-200",
          tags: ["Java", "Spring Boot", "React", "TensorFlow", "WebSocket"]
        },
        {
          id: 2,
          title: "Smart Customer Support Chatbot",
          description: "NLP + backend integrated bot",
          icon: "MessageSquare",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Java", "Spring Boot", "OpenAI API", "WebSocket", "NLP"]
        },
        {
          id: 3,
          title: "Healthcare Management System",
          description: "AI-assisted diagnosis + scheduling",
          icon: "Stethoscope",
          gradient: "from-amber-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
          borderColor: "border-amber-200",
          tags: ["Java", "Spring Boot", "PostgreSQL", "AI/ML"]
        },
        {
          id: 4,
          title: "Intelligent Job Portal",
          description: "AI-powered job matching + resume parsing",
          icon: "Briefcase",
          gradient: "from-indigo-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
          borderColor: "border-indigo-200",
          tags: ["Java", "Spring Boot", "Redis", "MongoDB", "NLP"]
        },
        {
          id: 5,
          title: "AI Content Management System",
          description: "Auto-tagging + content generation",
          icon: "FileText",
          gradient: "from-rose-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
          borderColor: "border-rose-200",
          tags: ["Java", "Spring Boot", "Redis", "MySQL", "AI"]
        },
        {
          id: 6,
          title: "Fraud Detection System",
          description: "Real-time transaction monitoring",
          icon: "Shield",
          gradient: "from-red-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-200",
          tags: ["Java", "Spring Boot", "React", "Redis", "ML"]
        },
        {
          id: 7,
          title: "E-Learning Platform with AI Tutor",
          description: "Personalized learning paths",
          icon: "GraduationCap",
          gradient: "from-cyan-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
          borderColor: "border-cyan-200",
          tags: ["Java", "Spring Boot", "React", "MongoDB", "AI"]
        },
        {
          id: 8,
          title: "AI-Powered Project Management Tool",
          description: "Smart task assignment + timeline prediction",
          icon: "Kanban",
          gradient: "from-lime-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-lime-50 to-emerald-50",
          borderColor: "border-lime-200",
          tags: ["Java", "Spring Boot", "React", "PostgreSQL", "AI"]
        },
        {
          id: 9,
          title: "Music Recommendation System",
          description: "Personalized playlists + mood detection",
          icon: "Music",
          gradient: "from-violet-500 to-purple-500",
          bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
          borderColor: "border-violet-200",
          tags: ["Java", "Spring Boot", "React", "Redis", "ML"]
        }
      ],
      techStack: [
        {
          category: "Backend Technologies",
          icon: "Server",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Java", iconSrc: "/BT1.webp" },
            { label: "Spring Boot", iconSrc: "/BT2.webp" },
            { label: "Spring Security", iconSrc: "/BT3.webp" },
            { label: "Hibernate & JPA", iconSrc: "/BT4.webp" },
            { label: "Maven/Gradle", iconSrc: "/BT5.webp" },
            { label: "REST APIs", iconSrc: "/BT6.webp" }
          ]
        },
        {
          category: "Frontend Technologies",
          icon: "Globe",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "HTML5", iconSrc: "/FT1.webp" },
            { label: "CSS3", iconSrc: "/FT2.webp" },
            { label: "JavaScript", iconSrc: "/FT3.webp" },
            { label: "React.js", iconSrc: "/FT4.webp" },
            { label: "Redux/Context", iconSrc: "/FT5.webp" },
            { label: "MUI/Tailwind", iconSrc: "/FT6.webp" }
          ]
        },
        {
          category: "Database & DevOps",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "PostgreSQL", iconSrc: "/DD2.webp" },
            { label: "MongoDB", iconSrc: "/DD3.webp" },
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "Kubernetes", iconSrc: "/DD5.webp" },
            { label: "AWS", iconSrc: "/DD6.webp" },
            { label: "Git & GitHub", icon: "GitBranch" }
          ]
        },
        {
          category: "AI & ML Integration",
          icon: "Brain",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "OpenAI", iconSrc: "/AI1.webp" },
            { label: "Hugging Face", iconSrc: "/AI2.webp" },
            { label: "LangChain4j", iconSrc: "/AI3.webp" },
            { label: "Vector DBs", iconSrc: "/AI4.webp" },
            { label: "RAG Architecture", iconSrc: "/AI5.webp" },
            { label: "DeepLearning4j", iconSrc: "/AI6.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Full-Stack Developer",
          salary: "$85k–$140k",
          icon: "Cpu",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Build complete web applications using Java + React + DevOps."
        },
        {
          title: "AI Integration Developer",
          salary: "$95k–$160k",
          icon: "Brain",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Integrate LLMs, APIs, vector search & RAG into applications."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["AI Ecommerce", "Healthcare System", "Job Portal", "Financial Dashboard"],
        outcome: "Production-ready AI-powered app"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["DSA & LeetCode", "System Design", "Java + Spring"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack product-based interviews"
      }
    }
  },
  {
    id: 8,
    category: "Development",
    format: "LIVE ONLINE",
    title: "Python Programming",
    description:
      "Master Python from fundamentals to advanced concepts with real-world projects.",
    features: [
      "Python Fundamentals",
      "Data Structures",
      "OOP & Functional Programming",
      "File Handling",
      "Libraries",
      "Projects"
    ],
    image: "/Eighth.webp",
    slug: "python-programming",
    icon: FaTerminal,
    heroSubtitle: "with AI Integration",
    heroDescription: "Master Python, Django, React, FastAPI, Docker, AWS & cutting-edge AI/ML integration.",
    heroSubDescription: "Build production-grade applications and land high-paying jobs at top tech companies.",
    companies: ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },

    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: 'Weekly Assignments',
          description: 'Hands-on coding tasks and exercises after each concept to reinforce learning',
          features: [
            'Weekly Evaluations',
            'Automated Testing',
            'Progress Tracking'
          ],
          backContent: {
            points: [
              'Python coding exercises after every module',
              'Progress tracking dashboard',
              'Automated test case evaluation',
              'Real-world problem solving with Python',
              'Concept application tasks'
            ],
            frequency: 'Every Week',
            weightage: '20% of final grade'
          }
        },
        {
          id: 1,
          title: 'Module Assessments',
          description: 'Comprehensive assessments for each module to validate understanding',
          features: [
            'MCQ + Coding Challenges',
            'Skill Gap Analysis',
            'Detailed Reports'
          ],
          backContent: {
            points: [
              'MCQ + Python coding challenges',
              'Problem-solving assessments',
              'Detailed performance reports',
              'Skill gap analysis',
              'Module Tests validation'
            ],
            frequency: 'After Each Module',
            weightage: '30% of final grade'
          }
        },
        {
          id: 2,
          title: 'Project Evaluations',
          description: 'Comprehensive review of real-world Python projects with detailed feedback',
          features: [
            'Architecture Review',
            'Best Practices Check',
            'Deployment Ready'
          ],
          backContent: {
            points: [
              'Python project architecture evaluation',
              'Django/FastAPI best practices assessment',
              'Deployment readiness check',
              'Code quality and functionality testing',
              'AI integration evaluation'
            ],
            frequency: 'Per Project',
            weightage: '40% of final grade'
          }
        },
        {
          id: 3,
          title: 'Certification Benefits',
          description: 'Industry-recognized certificate with global recognition',
          features: [
            'Industry Recognized',
            'Global Validity',
            'Hiring Partner Access'
          ],
          backContent: {
            points: [
              'Industry-recognized certificate',
              'Global recognition',
              'Hiring partner acceptance',
              'Decisions network access',
              'Verified skills validation'
            ],
            frequency: 'Program Completion',
            weightage: 'Official Certification'
          }
        }
      ],
      certificateData: {
        title: 'Industry-Recognized Certification',
        description: 'Our certificate validates your Python and AI skills and demonstrates your competency to employers worldwide.',
        benefits: [
          'Industry-recognized certificate',
          'Global recognition and validity',
          'Hiring partner acceptance',
          'Decisions network access',
          'Verified by industry experts',
          'Includes digital badge for LinkedIn'
        ],
        certificateDetails: {
          title: 'Certificate of Completion',
          subtitle: 'Full-Stack Python Development',
          subSubtitle: 'Covering Python, Django, FastAPI, REST APIs, Database Management, Frontend Development, AI Integration, Machine Learning, Cloud Deployment, and Real-World Full Stack AI Application Projects.',
          rating: 5
        }
      }
    },

    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6–8 Months • 600–700 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Python Fundamentals & Core Concepts",
          icon: "Code",
          duration: "8-10 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-200 to-indigo-200",
          borderColor: "border-blue-700",
          topics: [
            {
              title: "Python Basics (4–5 Weeks)",
              color: "blue-500",
              items: [
                "Python Installation, virtual environments, IDEs (PyCharm, VS Code)",
                "Data types, variables, operators, control structures",
                "OOP principles: Classes, Objects, Inheritance, Polymorphism",
                "Exception handling and debugging",
                "Data structures: Lists, Tuples, Sets, Dictionaries",
                "File I/O operations",
                "Functional programming with Python",
                "Python 3.10+ features: Pattern matching, type hints"
              ]
            },
            {
              title: "Advanced Python & Design Patterns (4–5 Weeks)",
              color: "indigo-500",
              items: [
                "SOLID principles and clean code practices",
                "Design Patterns: Singleton, Factory, Builder, Observer, Strategy, MVC",
                "Database connectivity with SQLAlchemy",
                "Unit testing with pytest and unittest",
                "pip and poetry for dependency management",
                "Git version control and GitHub workflow",
                "Web scraping with BeautifulSoup and Requests"
              ]
            }
          ],
          projects: [
            {
              title: "Mini Project:",
              description: "Console-based application (Survey Management/Banking System)",
              color: "blue"
            },
            {
              title: "Advanced Project:",
              description: "Multi-threaded application with database integration",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Backend Development with Django & FastAPI",
          icon: "Server",
          duration: "6-7 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Django Framework Core (3–4 Weeks)",
              color: "green-500",
              items: [
                "Django ORM and MVT architecture",
                "Django REST Framework for API development",
                "Class-based views and function-based views",
                "REST API design principles",
                "Request/Response handling, validation",
                "Exception handling and error responses",
                "Authentication and authorization"
              ]
            },
            {
              title: "Database & Persistence (3–4 Weeks)",
              color: "emerald-500",
              items: [
                "Relational databases: PostgreSQL/MySQL",
                "SQL: Schemas, queries, joins, indexes, transactions",
                "Query optimization",
                "ORM queries and automated queries",
                "Database optimization and indexing",
                "NoSQL databases: MongoDB with PyMongo",
                "Caching strategies with Redis",
                "FastAPI for high-performance APIs"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Build REST APIs for an e-commerce platform",
              color: "green"
            },
            {
              title: "Project 2:",
              description: "Multi-entity database application with complex relationships",
              color: "emerald"
            },
            {
              title: "Project 3:",
              description: "Secure microservices application with authentication",
              color: "teal"
            }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Frontend Development",
          icon: "Globe",
          duration: "6-7 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Web Fundamentals (3 Weeks)",
              color: "purple-500",
              items: [
                "HTML5: semantic elements, accessibility, SEO basics",
                "CSS3: Flexbox, Grid, custom properties, animations, transitions",
                "Responsive design: Mobile-first, media queries, viewport",
                "Modern CSS: Tailwind CSS utility framework",
                "JavaScript: ES6+ features, arrow functions, destructuring, modules",
                "DOM manipulation, event handling, and debugging",
                "Fetch API, async/await, error handling",
                "Modern tooling: npm, package.json, ES modules"
              ]
            },
            {
              title: "React.js Fundamentals (3–4 Weeks)",
              color: "violet-500",
              items: [
                "React setup with Create React App",
                "JSX, components, props, state, virtual DOM",
                "React hooks: useState, useEffect, useContext, useReducer, useMemo, useCallback",
                "React Router v6 for navigation",
                "Form handling with Formik/React Hook Form, validation",
                "State management: Context API, Redux Toolkit",
                "API integration: Axios, React Query/TanStack Query",
                "Performance: memo, useMemo, useCallback, lazy loading"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "Multi-page responsive website (Restaurant / Portfolio)",
              color: "purple"
            },
            {
              title: "Project 2:",
              description: "Full-featured E-Commerce SPA with auth, cart, and payments",
              color: "violet"
            },
            {
              title: "Capstone:",
              description: "Social Media Dashboard / Task Manager with Real-time Updates",
              color: "fuchsia"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Advanced Frontend & Integration",
          icon: "Layers",
          duration: "4-5 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "Advanced Frontend Concepts (4–5 Weeks)",
              color: "orange-500",
              items: [
                "TypeScript integration with React",
                "UI Libraries: Material UI / Ant Design / Chakra UI",
                "Frontend testing: Jest, React Testing Library",
                "Progressive Web Apps (PWA): Service workers, offline support",
                "Real-time features with WebSocket / Socket.io",
                "Authentication flow: JWT storage, refresh tokens",
                "Full stack integration: Connect React with Django APIs",
                "Deployment: Vercel, Netlify, GitHub Pages",
                "Performance optimization & debugging best practices"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Project:",
              description: "Complete full-stack app with advanced features",
              color: "orange"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "AI Integration with Python",
          icon: "Brain",
          duration: "4-5 Weeks",
          gradient: "from-pink-500 to-rose-600",
          bgColor: "bg-gradient-to-br from-pink-50 to-rose-50",
          borderColor: "border-pink-200",
          topics: [
            {
              title: "AI/ML Fundamentals (2 Weeks)",
              color: "pink-500",
              items: [
                "Introduction to Machine Learning & AI terminology",
                "Types of learning: Supervised, Unsupervised, Reinforcement",
                "Key concepts: Features, Labels, training, inference",
                "Python ML ecosystem: Scikit-learn, TensorFlow, PyTorch",
                "Understanding neural networks and deployment",
                "Data preprocessing and feature engineering"
              ]
            },
            {
              title: "AI Integration via APIs (2–3 Weeks)",
              color: "rose-500",
              items: [
                "REST API calls with requests library",
                "OpenAI GPT-4, Claude, Gemini integration",
                "Hugging Face inference API and Transformers",
                "Cloud platforms: Vertex AI, AWS SageMaker",
                "Building chatbots, content generators",
                "Semantic search and natural language processing",
                "Prompt engineering best practices",
                "Rate limiting, caching, error handling"
              ]
            }
          ],
          projects: [
            {
              title: "Project 1:",
              description: "AI-powered Customer Support Chatbot with Django backend",
              color: "pink"
            },
            {
              title: "Project 2:",
              description: "Intelligent Resume Analyzer with RAG + Private Knowledge Base",
              color: "rose"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "DevOps, Cloud & Deployment",
          icon: "Cloud",
          duration: "4-5 Weeks",
          gradient: "from-red-500 to-orange-600",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "DevOps Essentials (2–3 Weeks)",
              color: "red-500",
              items: [
                "Linux command line basics",
                "Docker containerization",
                "Docker Compose for multi-container apps",
                "Kubernetes basics (optional)",
                "CI/CD pipelines with GitHub Actions/Jenkins",
                "Automated testing and deployment",
                "Monitoring and logging (ELK Stack basics)"
              ]
            },
            {
              title: "Cloud Deployment (2–3 Weeks)",
              color: "orange-500",
              items: [
                "Cloud computing fundamentals",
                "AWS services: EC2, RDS, S3, Lambda",
                "Deployment strategies in AWS Elastic Beanstalk",
                "Network infrastructure and security groups",
                "Environment variables and configuration management",
                "Database hosting: AWS RDS / MongoDB Atlas",
                "CDN and static file serving"
              ]
            }
          ],
          projects: [
            {
              title: "Project:",
              description: "Deploy full-stack application to cloud",
              color: "orange"
            }
          ]
        },
        {
          id: 6,
          title: "Phase 7",
          subtitle: "Capstone Projects & Interview Preparation",
          icon: "Rocket",
          duration: "4-6 Weeks",
          gradient: "from-cyan-500 to-blue-600",
          bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
          borderColor: "border-cyan-200",
          topics: [
            {
              title: "Capstone Project Development (2–3 Weeks)",
              color: "cyan-500",
              items: [
                "AI-Powered E-Commerce Platform",
                "Smart Healthcare Management System",
                "Intelligent Job Portal",
                "Financial Analytics Dashboard",
                "Content Management System with AI",
                "Agile development methodology",
                "Sprint planning and execution",
                "Code reviews and best practices"
              ]
            },
            {
              title: "Interview Preparation (1–2 Weeks)",
              color: "blue-500",
              items: [
                "Data Structures & Algorithms in Python",
                "Problem-solving on LeetCode/HackerRank",
                "System design principles",
                "Python, Django, FastAPI, ML concepts",
                "Resume building and LinkedIn optimization",
                "Mock interviews and feedback",
                "Salary negotiation tips"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Outcome:",
              description: "Production-ready full-stack application with AI",
              color: "cyan"
            },
            {
              title: "Interview Outcome:",
              description: "Crack technical interviews at product companies",
              color: "blue"
            }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "E-Commerce Platform with Recommendation Engine",
          description: "Full-stack e-commerce application with AI-powered product recommendations, user authentication, payment integration, and admin dashboard",
          icon: "ShoppingCart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Python", "Django", "React", "AI/ML", "PostgreSQL"]
        },
        {
          id: 1,
          title: "AI-Powered Financial Analytics Dashboard",
          description: "Real-time financial data visualization with predictive analytics, stock prediction, and portfolio management",
          icon: "LineChart",
          gradient: "from-emerald-500 to-teal-500",
          bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
          borderColor: "border-emerald-200",
          tags: ["Python", "FastAPI", "React", "TensorFlow", "WebSocket"]
        },
        {
          id: 2,
          title: "Smart Customer Support Chatbot",
          description: "AI chatbot integration with Django for automated support, ticket management, and sentiment analysis",
          icon: "MessageSquare",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Python", "Django", "OpenAI API", "NLP", "WebSocket"]
        },
        {
          id: 3,
          title: "Healthcare Management System",
          description: "Patient records, appointment scheduling, AI-assisted diagnosis, and telemedicine features",
          icon: "Stethoscope",
          gradient: "from-amber-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
          borderColor: "border-amber-200",
          tags: ["Python", "Django", "PostgreSQL", "AI/ML"]
        },
        {
          id: 4,
          title: "Intelligent Job Portal",
          description: "AI-powered job matching with resume parsing, skill assessment, and automated applications",
          icon: "Briefcase",
          gradient: "from-indigo-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
          borderColor: "border-indigo-200",
          tags: ["Python", "Django", "Redis", "MongoDB", "NLP"]
        },
        {
          id: 5,
          title: "Fraud Detection System",
          description: "Real-time transaction monitoring with ML-based anomaly detection and alerts",
          icon: "Shield",
          gradient: "from-red-500 to-orange-500",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-200",
          tags: ["Python", "FastAPI", "React", "Redis", "ML"]
        },
        {
          id: 6,
          title: "AI Content Management System",
          description: "Auto tagging, content generation, SEO optimization, and personalized recommendations",
          icon: "FileText",
          gradient: "from-rose-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
          borderColor: "border-rose-200",
          tags: ["Python", "Django", "Redis", "MySQL", "AI"]
        },
        {
          id: 7,
          title: "E-Learning Platform with AI Tutor",
          description: "Personalized learning paths, AI tutor, progress tracking, and discussion forums",
          icon: "GraduationCap",
          gradient: "from-cyan-500 to-blue-500",
          bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
          borderColor: "border-cyan-200",
          tags: ["Python", "Django", "React", "MongoDB", "AI"]
        },
        {
          id: 8,
          title: "AI-Powered Project Management Tool",
          description: "Smart task assignment, timeline prediction, and resource optimization using AI",
          icon: "Kanban",
          gradient: "from-lime-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-lime-50 to-emerald-50",
          borderColor: "border-lime-200",
          tags: ["Python", "FastAPI", "React", "PostgreSQL", "AI"]
        },
        {
          id: 9,
          title: "Music Recommendation System",
          description: "Personalized playlists with mood detection and collaborative filtering",
          icon: "Music",
          gradient: "from-violet-500 to-purple-500",
          bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
          borderColor: "border-violet-200",
          tags: ["Python", "Django", "React", "Redis", "ML"]
        }
      ],
      techStack: [
        {
          category: "Backend Technologies",
          icon: "Server",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Python 3.10+", iconSrc: "/BT1.webp" },
            { label: "Django", iconSrc: "/BT2.webp" },
            { label: "FastAPI", iconSrc: "/BT3.webp" },
            { label: "SQL Alchemy", iconSrc: "/BT4.webp" },
            { label: "pytest & unittest", iconSrc: "/BT5.webp" },
            { label: "REST APIs", iconSrc: "/BT6.webp" }
          ]
        },
        {
          category: "Frontend Technologies",
          icon: "Globe",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "HTML5", iconSrc: "/FT1.webp" },
            { label: "CSS3", iconSrc: "/FT2.webp" },
            { label: "JavaScript ES6+", iconSrc: "/FT3.webp" },
            { label: "React.js", iconSrc: "/FT4.webp" },
            { label: "Redux/Context API", iconSrc: "/FT5.webp" },
            { label: "Material UI / Tailwind", iconSrc: "/FT6.webp" }
          ]
        },
        {
          category: "Database & DevOps",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "PostgreSQL", iconSrc: "/DD2.webp" },
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "MongoDB", iconSrc: "/DC3.webp" },
            { label: "Redis", iconSrc: "/CP6.webp" },
            { label: "Docker", iconSrc: "/DD4.webp" },
            { label: "Kubernetes", iconSrc: "/DD5.webp" },
            { label: "AWS Cloud", iconSrc: "/DD6.webp" },
            { label: "Git & GitHub", icon: "GitBranch" }
          ]
        },
        {
          category: "AI & ML Integration",
          icon: "Brain",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "OpenAI GPT-4", iconSrc: "/AI1.webp" },
            { label: "Hugging Face", iconSrc: "/AI2.webp" },
            { label: "LangChain", iconSrc: "/AI3.webp" },
            { label: "Vector Databases", iconSrc: "/AI4.webp" },
            { label: "RAG Architecture", iconSrc: "/AI5.webp" },
            { label: "TensorFlow/PyTorch", iconSrc: "/AI6.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Python Full-Stack Developer",
          salary: "$80k–$135k",
          icon: "Cpu",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Build complete web applications using Python + React + DevOps."
        },
        {
          title: "AI Integration Developer",
          salary: "$90k–$150k",
          icon: "Brain",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Integrate LLMs, APIs, vector search & RAG into Python applications."
        },
        {
          title: "Backend Engineer (Python)",
          salary: "$85k–$140k",
          icon: "Server",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Design and build scalable backend systems with Django/FastAPI."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["AI Ecommerce", "Healthcare System", "Job Portal", "Financial Dashboard"],
        outcome: "Production-ready AI-powered Python application"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["DSA in Python", "System Design", "Python + Django + FastAPI"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack product-based interviews"
      }
    }

  },
  {
    id: 3,
    category: "Development",
    format: "LIVE ONLINE",
    title: "Full Stack PHP",
    description:
      "Master PHP with Laravel framework and build dynamic web applications with MySQL database.",
    features: [
      "Laravel Framework",
      "MySQL Database",
      "RESTful APIs",
      "Vue.js Integration",
      "Authentication",
      "Deployment"
    ],
    image: "/Third.webp",
    slug: "full-stack-php",
    icon: FaCode
  },
  {
    id: 7,
    category: "Development",
    format: "LIVE ONLINE",
    title: "Full Stack MERN",
    description:
      "End-to-end JavaScript development with MongoDB, Express, React, and Node.",
    features: [
      "React.js",
      "Node.js & Express",
      "MongoDB",
      "Redux / Context API",
      "REST APIs",
      "Authentication"
    ],
    image: "/Seventh.webp",
    slug: "full-stack-mern",
    icon: FaCode
  },
  {
    id: 1,
    category: "Cybersecurity",
    format: "LIVE ONLINE",
    title: "Cybersecurity Professional",
    description:
      "Protect systems and networks from digital attacks and security breaches. Master the latest security protocols and threat detection techniques.",
    features: [
      "Network Security",
      "Threat Detection",
      "Security Protocols",
      "Incident Response",
      "Penetration Testing",
      "Risk Management"
    ],
    image: "/First.webp",
    slug: "cybersecurity-professional",
    icon: FaShieldAlt
  },
  {
    id: 2,
    category: "Cybersecurity",
    format: "LIVE ONLINE",
    title: "Ethical Hacking Expert",
    description:
      "Learn to think like a hacker to identify and fix security vulnerabilities. Master penetration testing and vulnerability assessment.",
    features: [
      "Penetration Testing",
      "Vulnerability Assessment",
      "Security Tools",
      "Red Team Tactics",
      "Web App Security",
      "Network Security"
    ],
    image: "/Second.webp",
    slug: "ethical-hacking-expert",
    icon: FaBolt
  },
  {
    id: 5,
    category: "Cloud & DevOps",
    format: "LIVE ONLINE",
    title: "Data Engineering",
    description:
      "Build scalable data pipelines and infrastructure for big data processing.",
    features: [
      "Big Data Technologies",
      "ETL Pipelines",
      "Data Warehousing",
      "Cloud Solutions",
      "Spark",
      "Airflow"
    ],
    image: "/Fifth.webp",
    slug: "data-engineering",
    icon: FaDatabase,
    heroTitle: "Data Engineering with AI & Cloud Integration",
    heroSubtitle: "with Big Data & Cloud Platforms",
    heroDescription: "Master Big Data, ETL/ELT, Data Warehousing, Spark, Airflow, AWS, GCP & cutting-edge AI/ML tools.",
    heroSubDescription: "Build production-grade data pipelines and land high-paying jobs at top tech companies.",


    companies: ["Google", "Amazon", "Microsoft", "Uber", "Netflix", "Airbnb"],
    ctaButtons: {
      primary: "Enroll Now - Limited Seats",
      secondary: "Explore Full Curriculum"
    },

    assessmentCertification: {
      assessmentCards: [
        {
          id: 0,
          title: 'Weekly SQL & Python Challenges',
          description: 'Database queries and Python scripts for data processing tasks',
          features: [
            'SQL Query Optimization',
            'Python ETL Scripts',
            'Pipeline Design'
          ],
          backContent: {
            points: [
              'Complex SQL query writing',
              'Python data processing scripts',
              'Database design exercises',
              'ETL pipeline design',
              'Performance optimization tasks'
            ],
            frequency: 'Every Week',
            weightage: '20% of final grade'
          }
        },
        {
          id: 1,
          title: 'Module Pipeline Projects',
          description: 'End-to-end data pipeline implementation for each module',
          features: [
            'ETL Pipeline Building',
            'Data Warehouse Design',
            'Cloud Deployment'
          ],
          backContent: {
            points: [
              'Complete ETL/ELT pipeline development',
              'Data warehouse schema design',
              'Cloud data solution implementation',
              'Performance testing and optimization',
              'Documentation and deployment'
            ],
            frequency: 'After Each Module',
            weightage: '35% of final grade'
          }
        },
        {
          id: 2,
          title: 'Big Data Project Evaluations',
          description: 'Comprehensive review of distributed data processing projects',
          features: [
            'Spark Application Review',
            'Cloud Architecture Assessment',
            'Scalability Analysis'
          ],
          backContent: {
            points: [
              'Spark job optimization evaluation',
              'Cloud architecture design review',
              'Scalability and performance testing',
              'Cost optimization analysis',
              'Production readiness assessment'
            ],
            frequency: 'Per Major Project',
            weightage: '35% of final grade'
          }
        },
        {
          id: 3,
          title: 'Data Engineering Certification',
          description: 'Industry-recognized data engineering certification',
          features: [
            'Cloud Platform Certified',
            'Big Data Specialization',
            'Industry Recognition'
          ],
          backContent: {
            points: [
              'Cloud platform certification preparation',
              'Big data technology specialization',
              'Industry-recognized credential',
              'Hiring partner acceptance',
              'GitHub portfolio certification'
            ],
            frequency: 'Program Completion',
            weightage: 'Official Certification'
          }
        }
      ],
      certificateData: {
        title: 'Industry-Recognized Data Engineering Certification',
        description: 'Our certificate validates your big data engineering skills and demonstrates your competency with modern data platforms.',
        benefits: [
          'Big Data specialization certificate',
          'Cloud platform recognition',
          'Industry hiring partner access',
          'GitHub portfolio certification',
          'Verified by data engineering experts',
          'Includes digital badge for LinkedIn'
        ],
        certificateDetails: {
          title: 'Certificate of Completion',
          subtitle: 'Data Engineering & Cloud Integration',
          subSubtitle: 'Covering Python, Apache Spark, Hadoop, Kafka, Airflow, ETL Pipelines, Data Warehousing, Cloud Platforms, and Real-World Data Engineering Projects.',
          rating: 5
        }
      }
    },

    curriculum: {
      title: "Comprehensive Curriculum",
      description: "6–8 Months • 600–700 Hours",
      phases: [
        {
          id: 0,
          title: "Phase 1",
          subtitle: "Data Engineering Fundamentals",
          icon: "Database",
          duration: "8-10 Weeks",
          gradient: "from-blue-500 to-indigo-600",
          bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
          borderColor: "border-blue-200",
          topics: [
            {
              title: "SQL & Database Mastery (4-5 Weeks)",
              color: "blue-500",
              items: [
                "SQL fundamentals: SELECT, WHERE, JOIN, GROUP BY, HAVING",
                "Advanced SQL: Window functions, CTEs, Subqueries",
                "Database design: Normalization, Indexing, Constraints",
                "Procedural SQL: Stored procedures and functions",
                "Performance tuning and query optimization",
                "Schema design and management"
              ]
            },
            {
              title: "Python for Data Engineering (4-5 Weeks)",
              color: "indigo-500",
              items: [
                "Python fundamentals: Data types, functions, OOP",
                "Data structures and algorithms in Python",
                "File handling: CSV, JSON, Parquet",
                "REST API integration and web scraping",
                "Python for ETL: Data extraction, transformation, loading",
                "Unit testing and debugging"
              ]
            }
          ],
          projects: [
            {
              title: "Main Project:",
              description: "Build a comprehensive E-commerce database with complex queries",
              color: "blue"
            },
            {
              title: "Main Project:",
              description: "Build an ETL pipeline to process and analyze sales data",
              color: "indigo"
            }
          ]
        },
        {
          id: 1,
          title: "Phase 2",
          subtitle: "Big Data Technologies",
          icon: "Server",
          duration: "8-10 Weeks",
          gradient: "from-green-500 to-emerald-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          topics: [
            {
              title: "Apache Spark (4-5 Weeks)",
              color: "green-500",
              items: [
                "Spark Architecture: Driver, Executors, Cluster Manager",
                "RDDs, DataFrames, and Datasets",
                "Spark SQL for structured data processing",
                "Spark Streaming for real-time data",
                "Performance optimization techniques",
                "Spark vs Hadoop comparison"
              ]
            },
            {
              title: "Hadoop Ecosystem (4-5 Weeks)",
              color: "emerald-500",
              items: [
                "HDFS architecture and operations",
                "MapReduce programming model",
                "YARN resource management",
                "Hive for data warehousing",
                "HBase for NoSQL storage",
                "Sqoop for data transfer"
              ]
            }
          ],
          projects: [
            {
              title: "Project:",
              description: "Process large-scale dataset using Spark for analytics",
              color: "green"
            },
            {
              title: "Project:",
              description: "Build a complete data processing pipeline using Hadoop ecosystem",
              color: "emerald"
            }
          ]
        },
        {
          id: 2,
          title: "Phase 3",
          subtitle: "Data Warehousing & ETL/ELT",
          icon: "Warehouse",
          duration: "8-10 Weeks",
          gradient: "from-purple-500 to-violet-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
          borderColor: "border-purple-200",
          topics: [
            {
              title: "Data Warehousing Concepts (4-5 Weeks)",
              color: "purple-500",
              items: [
                "Data warehouse architecture and design",
                "Dimensional modeling: Star vs Snowflake schema",
                "ETL vs ELT approaches",
                "Data quality and governance",
                "Slowly Changing Dimensions (SCD)",
                "Data vault modeling"
              ]
            },
            {
              title: "ETL/ELT Pipeline Development (4-5 Weeks)",
              color: "violet-500",
              items: [
                "Apache Airflow for workflow orchestration",
                "dbt (Data Build Tool) for transformation",
                "Incremental data loading strategies",
                "Error handling and monitoring",
                "Data pipeline testing",
                "Pipeline optimization techniques"
              ]
            }
          ],
          projects: [
            {
              title: "Project:",
              description: "Design and implement a data warehouse for retail analytics",
              color: "purple"
            },
            {
              title: "Project:",
              description: "Build an end-to-end ETL pipeline using Airflow and dbt",
              color: "violet"
            }
          ]
        },
        {
          id: 3,
          title: "Phase 4",
          subtitle: "Cloud Data Engineering",
          icon: "Cloud",
          duration: "8-10 Weeks",
          gradient: "from-orange-500 to-amber-600",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          topics: [
            {
              title: "AWS Data Services (4-5 Weeks)",
              color: "orange-500",
              items: [
                "AWS S3 for data storage",
                "Redshift for data warehousing",
                "Glue for ETL operations",
                "EMR for big data processing",
                "Kinesis for real-time data",
                "Athena for serverless querying"
              ]
            },
            {
              title: "GCP & Azure Data Services (4-5 Weeks)",
              color: "amber-500",
              items: [
                "GCP: BigQuery, Dataproc, Dataflow",
                "GCP: Pub/Sub, Cloud Storage, Composer",
                "Azure Data Factory, Synapse Analytics",
                "Azure Databricks, EventHub",
                "Multi-cloud data strategies",
                "Cost optimization techniques"
              ]
            }
          ],
          projects: [
            {
              title: "Project:",
              description: "Build a cloud-native data platform on AWS",
              color: "orange"
            },
            {
              title: "Project:",
              description: "Implement cross-cloud data solution",
              color: "amber"
            }
          ]
        },
        {
          id: 4,
          title: "Phase 5",
          subtitle: "Real-time Data & Streaming",
          icon: "Zap",
          duration: "6-8 Weeks",
          gradient: "from-red-500 to-pink-600",
          bgColor: "bg-gradient-to-br from-red-50 to-pink-50",
          borderColor: "border-red-200",
          topics: [
            {
              title: "Apache Kafka & Streaming (3-4 Weeks)",
              color: "red-500",
              items: [
                "Kafka architecture: Brokers, Topics, Partitions",
                "Producers and Consumers",
                "Kafka Connect for data integration",
                "Kafka Streams for stream processing",
                "Schema Registry and Avro",
                "Kafka security and monitoring"
              ]
            },
            {
              title: "Stream Processing (3-4 Weeks)",
              color: "pink-500",
              items: [
                "Spark Streaming for micro-batch processing",
                "Flink for fast stream processing",
                "State management and fault tolerance",
                "Window operations and watermarks",
                "Exactly-once processing semantics",
                "Real-time analytics use cases"
              ]
            }
          ],
          projects: [
            {
              title: "Project:",
              description: "Build real-time event streaming platform",
              color: "red"
            },
            {
              title: "Project:",
              description: "Implement real-time fraud detection system",
              color: "pink"
            }
          ]
        },
        {
          id: 5,
          title: "Phase 6",
          subtitle: "DataOps & Advanced Topics",
          icon: "Settings",
          duration: "6-8 Weeks",
          gradient: "from-teal-500 to-cyan-600",
          bgColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
          borderColor: "border-teal-200",
          topics: [
            {
              title: "DataOps & MLOps (3-4 Weeks)",
              color: "teal-500",
              items: [
                "DataOps principles and practices",
                "CI/CD for data pipelines",
                "Data quality monitoring",
                "Data lineage and cataloging",
                "MLOps for production ML systems",
                "Model deployment and monitoring"
              ]
            },
            {
              title: "Interview Preparation (3-4 Weeks)",
              color: "cyan-500",
              items: [
                "SQL optimization and performance",
                "System design for data systems",
                "Big data architecture patterns",
                "Behavioral interview preparation",
                "Resume building and LinkedIn optimization",
                "Mock interviews and feedback"
              ]
            }
          ],
          projects: [
            {
              title: "Capstone Project:",
              description: "End-to-end data platform with DataOps practices",
              color: "teal"
            },
            {
              title: "Interview Outcome:",
              description: "Crack data engineering interviews at top companies",
              color: "cyan"
            }
          ]
        }
      ],
      projects: [
        {
          id: 0,
          title: "Real-time E-commerce Analytics Platform",
          description: "Event-driven platform processing user clicks into insights, faster reporting, and alerts",
          icon: "ShoppingCart",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          tags: ["Kafka", "Spark", "Real-time", "AWS", "Analytics"]
        },
        {
          id: 1,
          title: "Multi-cloud Data Lake",
          description: "Data lake across AWS/GCP with unified access and governance",
          icon: "Cloud",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          tags: ["AWS", "GCP", "Data Lake", "S3", "BigQuery"]
        },
        {
          id: 2,
          title: "Healthcare Data Warehouse",
          description: "Enterprise-scale data warehouse for patient records and medical analytics",
          icon: "Stethoscope",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          tags: ["Redshift", "ETL", "Healthcare", "Data Warehouse", "SQL"]
        },
        {
          id: 3,
          title: "AI-Powered Recommendation Engine",
          description: "Real-time recommendation system processing user interactions and serving ML-based predictions",
          icon: "Brain",
          gradient: "from-orange-500 to-amber-500",
          bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
          borderColor: "border-orange-200",
          tags: ["Kafka", "ML", "Real-time", "Spark", "Recommendation"]
        },
        {
          id: 4,
          title: "Financial Data Pipeline",
          description: "High-frequency trading data processing with real-time analytics and fraud detection",
          icon: "TrendingUp",
          gradient: "from-red-500 to-rose-500",
          bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
          borderColor: "border-red-200",
          tags: ["Flink", "Kafka", "Finance", "Real-time", "Fraud Detection"]
        },
        {
          id: 5,
          title: "IoT Data Processing Platform",
          description: "Scalable platform for processing sensor data from millions of IoT devices",
          icon: "Cpu",
          gradient: "from-indigo-500 to-violet-500",
          bgColor: "bg-gradient-to-br from-indigo-50 to-violet-50",
          borderColor: "border-indigo-200",
          tags: ["Spark", "IoT", "Streaming", "Time Series", "Scalability"]
        }
      ],
      techStack: [
        {
          category: "Big Data Technologies",
          icon: "Server",
          borderColor: "border-blue-200",
          bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
          technologies: [
            { label: "Python", iconSrc: "/BDT1.webp" },
            { label: "Apache Spark", iconSrc: "/BDT2.webp" },
            { label: "Hadoop", iconSrc: "/BDT2.webp" },
            { label: "Apache Kafka", iconSrc: "/BDT3.webp" },
            { label: "Apache Airflow", iconSrc: "/BDT4.webp" },
            { label: "Apache Flink", iconSrc: "/BDT5.webp" }
          ]
        },
        {
          category: "Cloud Platforms",
          icon: "Cloud",
          borderColor: "border-purple-200",
          bgColor: "bg-gradient-to-r from-purple-50 to-violet-50",
          technologies: [
            { label: "AWS", iconSrc: "/CP1.webp" },
            { label: "Google Cloud", iconSrc: "/CP2.webp" },
            { label: "Azure", iconSrc: "/CP3.webp" },
            { label: "Databricks", iconSrc: "/CP4.webp" },
            { label: "Snowflake", iconSrc: "/CP5.webp" },
            { label: "Redshift", iconSrc: "/CP6.webp" }
          ]
        },
        {
          category: "Databases & Data Warehouses",
          icon: "Database",
          borderColor: "border-green-200",
          bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
          technologies: [
            { label: "PostgreSQL", iconSrc: "/DDW1.webp" },
            { label: "MySQL", iconSrc: "/DD1.webp" },
            { label: "MongoDB", iconSrc: "/DC3.webp" },
            { label: "Cassandra", iconSrc: "/DDW4.webp" },
            { label: "BigQuery", iconSrc: "/DDW5.svg" },
            { label: "Synapse", iconSrc: "/DDW6.webp" }
          ]
        },
        {
          category: "Data Processing & ML",
          icon: "Cpu",
          borderColor: "border-orange-200",
          bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
          technologies: [
            { label: "dbt", iconSrc: "/DP1.webp" },
            { label: "Docker", iconSrc: "/DP2.webp" },
            { label: "Kubernetes", iconSrc: "/DP3.webp" },
            { label: "TensorFlow", iconSrc: "/ML2.webp" },
            { label: "PyTorch", iconSrc: "/ML3.webp" },
            { label: "Apache Beam", iconSrc: "/DP6.webp" }
          ]
        }
      ],
      careerOutcomes: [
        {
          title: "Data Engineer",
          salary: "$85k–$140k",
          icon: "Database",
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-200",
          description: "Design, build, and maintain scalable data pipelines and infrastructure."
        },
        {
          title: "Big Data Engineer",
          salary: "$90k–$150k",
          icon: "Server",
          gradient: "from-green-500 to-emerald-500",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          description: "Work with distributed systems and process large-scale datasets using Spark and Hadoop."
        },
        {
          title: "Cloud Data Engineer",
          salary: "$95k–$160k",
          icon: "Cloud",
          gradient: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-200",
          description: "Build and manage data solutions on cloud platforms like AWS, GCP, and Azure."
        }
      ],
      capstoneData: {
        title: "Capstone Development",
        icon: "FileText",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        projects: ["End-to-end Data Platform", "Real Business Problem", "Multi-cloud Architecture"],
        outcome: "Production-ready data engineering platform with DataOps practices"
      },
      interviewPrep: {
        title: "Interview Preparation",
        icon: "Users",
        bgColor: "bg-white",
        borderColor: "border-red-200",
        technical: ["SQL Optimization", "System Design", "Big Data Architecture", "Cloud Platforms"],
        career: ["Resume + LinkedIn", "Mock Interviews", "Salary Negotiation"],
        outcome: "Crack data engineering interviews at top tech companies"
      }
    }
  },
  {
    id: 6,
    category: "Finance & Trading",
    format: "LIVE ONLINE",
    title: "Algorithmic Trading",
    description:
      "Master Python-based algorithmic trading strategies and quantitative analysis.",
    features: [
      "Python for Finance",
      "Trading Algorithms",
      "Risk Management",
      "Backtesting",
      "Quantitative Analysis",
      "Market Analysis"
    ],
    image: "/Sixth.webp",
    slug: "algorithmic-trading",
    icon: FaBrain
  },
  {
    id: 9,
    category: "Cloud & DevOps",
    format: "LIVE ONLINE",
    title: "DevOps Engineering",
    description:
      "Master CI/CD, containerization, and cloud infrastructure automation.",
    features: [
      "Docker & Kubernetes",
      "CI/CD Pipelines",
      "Cloud Platforms",
      "Infrastructure as Code",
      "Monitoring",
      "Automation"
    ],
    image: "/Ninth.webp",
    slug: "devops-engineering",
    icon: FaCloud,
  },
  {
    id: 10,
    category: "Data Science & AI",
    format: "LIVE ONLINE",
    title: "Machine Learning Specialist",
    description:
      "Build and deploy machine learning models for real-world applications.",
    features: [
      "ML Algorithms",
      "Deep Learning",
      "Model Deployment",
      "TensorFlow / PyTorch",
      "NLP",
      "Computer Vision"
    ],
    image: "/Tenth.webp",
    slug: "machine-learning-specialist",
    icon: FaBrain,
  }
];


export const courseIcons: IconType[] = [
  FaShieldAlt,
  FaBolt,
  FaCode,
  FaDatabase,
  FaCloud,
  FaChartLine,
  FaChartBar,
  FaMicrochip,
  FaTerminal,
  FaBrain
];


export const getIcon = (index: number): IconType => {
  return courseIcons[index % courseIcons.length];
};

export const filterCoursesByCategory = (
  activeCategory: string
): Course[] => {
  return activeCategory === "All Courses"
    ? allCourses
    : allCourses.filter(
      (course) => course.category === activeCategory
    );
};

export const isSingleCardLayout = (courses: Course[]): boolean => {
  return courses.length === 1;
};



export const CATEGORIES = [
  "All Courses",
  "Development",
  "Data Science & AI",
  "Cloud & DevOps",
  "Cybersecurity",
  "Finance & Trading"
] as const;

export const COURSE_METADATA = {
  hours: "50+ hours",
  students: "1.5k+ students"
} as const;

export const CARD_STYLES = {
  minHeight: {
    base: "min-h-[620px]",
    lg: "lg:min-h-[640px]"
  },
  imageHeight: "h-48"
} as const;

export const ANIMATION_DELAY = 0.1;

export const SECTION_CONFIG = {
  title: "Choose Your Track",
  description: "Master in-demand skills with our comprehensive courses",
} 