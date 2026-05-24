export type AccentColor = 'blue' | 'orange';

export interface FloatingIconConfig {
  icon: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay: number;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  bg: string;
  btn1: string;
  btn2: string;
  accent: AccentColor;
  image: string;
  floatingIcons: FloatingIconConfig[];
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: "Zero Coding → Dream Tech Job in 6 Months",
    subtitle: "Build 5+ portfolio projects • Get internship + placement assistance",
    bg: "from-blue-600 via-blue-500 to-blue-400",
    btn1: "Explore Courses",
    btn2: "Free master Class",
    accent: "blue",
    image: "/Zero.webp",
    floatingIcons: [
      { icon: "Code",        top: "12%",  left: "4%",   delay: 0   },
      { icon: "Laptop",      top: "70%",  left: "5%",   delay: 0.8 },
      { icon: "Rocket",      top: "20%",  right: "5%",  delay: 0.4 },
      { icon: "Briefcase",   bottom: "15%", right: "6%",  delay: 1.2 },
      { icon: "Star",        top: "45%",  left: "2%",   delay: 1.6 },
      { icon: "Zap",         top: "55%",  right: "4%",  delay: 2.0 },
    ]
  },
  {
    id: 2,
    title: "Join 500+ Students Who Got Placed This Year",
    subtitle: "Next batch in 7 days • Free demo class on WhatsApp",
    bg: "from-orange-600 via-orange-500 to-orange-400",
    btn1: "Explore Courses",
    btn2: "Free master Class",
    accent: "orange",
    image: "/Students.webp",
    floatingIcons: [
      { icon: "Users",       top: "12%",  left: "4%",   delay: 0   },
      { icon: "Award",       top: "70%",  left: "5%",   delay: 0.8 },
      { icon: "Trophy",      top: "20%",  right: "5%",  delay: 0.4 },
      { icon: "ThumbsUp",    bottom: "15%", right: "6%",  delay: 1.2 },
      { icon: "Handshake",   top: "45%",  left: "2%",   delay: 1.6 },
      { icon: "Star",        top: "55%",  right: "4%",  delay: 2.0 },
    ]
  },
  {
    id: 3,
    title: "2026 Batch Starting Soon – Get Hired at 8–15 LPA",
    subtitle: "500+ placed • 30+ hiring partners • Limited seats only",
    bg: "from-orange-600 via-orange-500 to-orange-400",
    btn1: "Explore Courses",
    btn2: "Free master Class",
    accent: "orange",
    image: "/Batch1.webp",
    floatingIcons: [
      { icon: "CalendarDays",  top: "12%",  left: "4%",   delay: 0   },
      { icon: "Target",        top: "70%",  left: "5%",   delay: 0.8 },
      { icon: "Building2",     top: "20%",  right: "5%",  delay: 0.4 },
      { icon: "BadgeCheck",    bottom: "15%", right: "6%", delay: 1.2 },
      { icon: "GraduationCap", top: "45%",  left: "2%",   delay: 1.6 },
      { icon: "TrendingUp",    top: "55%",  right: "4%",  delay: 2.0 },
    ]
  },
  {
    id: 4,
    title: "Get Hired at 8–15 LPA",
    subtitle: "500+ placed • 30+ hiring partners • Limited seats only",
    bg: "from-blue-700 via-blue-600 to-blue-500",
    btn1: "Explore Courses",
    btn2: "Free master Class",
    accent: "blue",
    image: "/Hired.webp",
    floatingIcons: [
      { icon: "DollarSign",  top: "12%",  left: "4%",   delay: 0   },
      { icon: "Briefcase",   top: "70%",  left: "5%",   delay: 0.8 },
      { icon: "LineChart",   top: "20%",  right: "5%",  delay: 0.4 },
      { icon: "Building",    bottom: "15%", right: "6%", delay: 1.2 },
      { icon: "Award",       top: "45%",  left: "2%",   delay: 1.6 },
      { icon: "MapPin",      top: "55%",  right: "4%",  delay: 2.0 },
    ]
  },
  {
    id: 5,
    title: "Land Your Dream Tech Job in 2026",
    subtitle: "Weekend & Weekday batches • No prior coding needed",
    bg: "from-orange-700 via-orange-600 to-orange-500",
    btn1: "Explore Courses",
    btn2: "Free master Class",
    accent: "orange",
    image: "/Job.webp",
    floatingIcons: [
      { icon: "Rocket",      top: "12%",  left: "4%",   delay: 0   },
      { icon: "Globe",       top: "70%",  left: "5%",   delay: 0.8 },
      { icon: "Compass",     top: "20%",  right: "5%",  delay: 0.4 },
      { icon: "BookOpen",    bottom: "15%", right: "6%", delay: 1.2 },
      { icon: "Cpu",         top: "45%",  left: "2%",   delay: 1.6 },
      { icon: "Sparkles",    top: "55%",  right: "4%",  delay: 2.0 },
    ]
  },
];


export interface ParticleConfig {
  delay: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
}

export const PARTICLE_CONFIGS: ParticleConfig[] = [
  { delay: 0, duration: 6, startX: 10, startY: 20, endX: 15, endY: 15, size: 8 },
  { delay: 0.5, duration: 7, startX: 85, startY: 15, endX: 80, endY: 20, size: 12 },
  { delay: 1, duration: 8, startX: 70, startY: 70, endX: 75, endY: 65, size: 6 },
  { delay: 1.5, duration: 6.5, startX: 15, startY: 80, endX: 20, endY: 75, size: 10 },
  { delay: 2, duration: 7.5, startX: 50, startY: 10, endX: 45, endY: 15, size: 7 },
  { delay: 0.3, duration: 8.5, startX: 90, startY: 85, endX: 85, endY: 80, size: 9 },
  { delay: 2.5, duration: 6, startX: 30, startY: 40, endX: 35, endY: 45, size: 8 },
  { delay: 1.8, duration: 7, startX: 60, startY: 85, endX: 55, endY: 80, size: 11 },
  { delay: 0.8, duration: 8, startX: 25, startY: 55, endX: 30, endY: 50, size: 6 },
  { delay: 3, duration: 7, startX: 80, startY: 45, endX: 75, endY: 50, size: 9 },
  { delay: 1.2, duration: 6.5, startX: 40, startY: 25, endX: 45, endY: 30, size: 7 },
  { delay: 2.8, duration: 8, startX: 65, startY: 35, endX: 60, endY: 40, size: 10 },
];

export const ANIMATION_DURATION = 600;
export const AUTOPLAY_DELAY = 3000;