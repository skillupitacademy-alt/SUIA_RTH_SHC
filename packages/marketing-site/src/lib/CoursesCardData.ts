
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
        initials: "SJ",
        name: "Suresh Joshi",
        title: "Senior Mentor & Career Coach",
        description: "Expert mentor specializing in placement and career roadmaps. Achieves a 100% success ratio with students who meticulously follow discussed guidance.",
        stats: [
          {
            value: "100%",
            label: "Success",
            icon: "FaChartLine",
            iconColor: "text-blue-600"
          },
          {
            value: "24/7",
            label: "Available",
            icon: "FaClock",
            iconColor: "text-purple-600"
          },
          {
            value: "25yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-amber-600"
          }
        ],
        tags: ["Career Roadmap", "Placement", "Mentorship", "Interview Prep", "Guidance"],
        color: "bg-gradient-to-r from-blue-600 to-cyan-500",
        rating: 5.0
      },
      {
        initials: "GJ",
        name: "Geeta Joshi",
        title: "Data Analyst Trainer",
        description: "Highly competent in data analyst training, adapting seamlessly to each student's understanding level to ensure comprehensive learning and practical skill development.",
        stats: [
          {
            value: "500+",
            label: "Trained",
            icon: "FaUsers",
            iconColor: "text-indigo-600"
          },
          {
            value: "4.9",
            label: "Rating",
            icon: "FaStar",
            iconColor: "text-amber-600"
          },
          {
            value: "10yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-emerald-600"
          }
        ],
        tags: ["Data Analysis", "SQL", "Excel", "Power BI", "Training", "Mentoring"],
        color: "bg-gradient-to-r from-purple-600 to-purple-500",
        rating: 4.9
      },
      {
        initials: "AL",
        name: "Anupama Lawate",
        title: "Interview & Selection Expert",
        description: "U.S. return with sizeable experience in technical and non-technical skills related to interview processes, national and international certifications, and higher studies guidance.",
        stats: [
          {
            value: "Global",
            label: "Reach",
            icon: "FaGlobe",
            iconColor: "text-green-600"
          },
          {
            value: "Expert",
            label: "Level",
            icon: "FaAward",
            iconColor: "text-teal-600"
          },
          {
            value: "18yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-blue-600"
          }
        ],
        tags: ["Interview Prep", "Soft Skills", "Certifications", "Higher Studies", "Technical Skills"],
        color: "bg-gradient-to-r from-emerald-600 to-green-500",
        rating: 5.0
      },
      {
        initials: "KP",
        name: "Kamal Pandey",
        title: "Data Scientist",
        description: "Experienced Data Scientist with a passion for teaching. Specializes in making complex data concepts easy to grasp and practical for real-world application.",
        stats: [
          {
            value: "15yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-amber-600"
          },
          {
            value: "500+",
            label: "Trained",
            icon: "FaUsers",
            iconColor: "text-blue-600"
          },
          {
            value: "4.9",
            label: "Rating",
            icon: "FaStar",
            iconColor: "text-purple-600"
          }
        ],
        tags: ["Data Science", "Python", "Machine Learning", "Teaching"],
        color: "bg-gradient-to-r from-cyan-600 to-blue-500",
        rating: 4.9
      },
      {
        initials: "AT",
        name: "Anil T.",
        title: "DevOps Engineer",
        description: "Veteran DevOps Engineer and instructor. Focuses on cloud infrastructure, automation, and continuous integration/deployment best practices.",
        stats: [
          {
            value: "15yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-blue-600"
          },
          {
            value: "Cloud",
            label: "Expert",
            icon: "FaCloud",
            iconColor: "text-emerald-600"
          },
          {
            value: "24/7",
            label: "Available",
            icon: "FaClock",
            iconColor: "text-indigo-600"
          }
        ],
        tags: ["DevOps", "Cloud", "AWS", "CI/CD", "Automation"],
        color: "bg-gradient-to-r from-orange-500 to-amber-500",
        rating: 4.9
      },
      {
        initials: "SC",
        name: "Sunil C.",
        title: "Project Manager",
        description: "Seasoned Project Manager and educator. Brings decades of industry experience to help students understand agile methodologies, leadership, and project lifecycles.",
        stats: [
          {
            value: "20yrs",
            label: "Exp",
            icon: "FaGraduationCap",
            iconColor: "text-purple-600"
          },
          {
            value: "Agile",
            label: "Master",
            icon: "FaAward",
            iconColor: "text-rose-600"
          },
          {
            value: "5.0",
            label: "Rating",
            icon: "FaStar",
            iconColor: "text-amber-600"
          }
        ],
        tags: ["Project Management", "Agile", "Leadership", "Scrum"],
        color: "bg-gradient-to-r from-rose-600 to-pink-500",
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



import { dataAnalystCourse } from './courses/data-analyst';
import { dataScienceAiBootcampCourse } from './courses/data-science-ai-bootcamp';
import { fullStackJavaCourse } from './courses/full-stack-java';
import { pythonProgrammingCourse } from './courses/python-programming';
import { fullStackPhpCourse } from './courses/full-stack-php';
import { fullStackMernCourse } from './courses/full-stack-mern';
import { cybersecurityProfessionalCourse } from './courses/cybersecurity-professional';
import { ethicalHackingExpertCourse } from './courses/ethical-hacking-expert';
import { dataEngineeringCourse } from './courses/data-engineering';
import { algorithmicTradingCourse } from './courses/algorithmic-trading';
import { devopsEngineeringCourse } from './courses/devops-engineering';
import { machineLearningSpecialistCourse } from './courses/machine-learning-specialist';

export const allCourses: Course[] = [
  dataAnalystCourse,
  dataScienceAiBootcampCourse,
  fullStackJavaCourse,
  pythonProgrammingCourse,
  fullStackPhpCourse,
  fullStackMernCourse,
  cybersecurityProfessionalCourse,
  ethicalHackingExpertCourse,
  dataEngineeringCourse,
  algorithmicTradingCourse,
  devopsEngineeringCourse,
  machineLearningSpecialistCourse,
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