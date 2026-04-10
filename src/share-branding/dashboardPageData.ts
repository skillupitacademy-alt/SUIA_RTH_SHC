import { BrandConfig } from './brandConfig';

export interface DashboardNavItem {
  label: string;
  href: string;
}

export interface DashboardStep {
  label: string;
  completed: boolean;
}

export interface DashboardActivityItem {
  title: string;
  description: string;
  time: string;
  tone: 'success' | 'info' | 'accent' | 'warning';
}

export interface DashboardMetricPoint {
  subject: string;
  value: number;
  fullMark: number;
}

export interface DashboardCertificationItem {
  label: string;
  status: 'completed' | 'pending';
}

export interface DashboardSuggestion {
  title: string;
  description: string;
  tone: 'accent' | 'info' | 'warning';
  ctaLabel: string;
}

export interface DashboardSyncTopic {
  title: string;
  status: 'failed' | 'weak' | 'mastered';
  score: number;
  action: string;
}

export interface DashboardViewData {
  header: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    streakLabel: string;
    streakCount: number;
    userName: string;
    userRole: string;
    userInitials: string;
  };
  navigation: DashboardNavItem[];
  hero: {
    badge: string;
    title: string;
    description: string;
    ctaLabel: string;
  };
  engineProgress: {
    title: string;
    steps: DashboardStep[];
  };
  sync: {
    title: string;
    topics: DashboardSyncTopic[];
    ctaLabel: string;
  };
  activity: {
    title: string;
    items: DashboardActivityItem[];
  };
  dailyProgress: {
    title: string;
    hoursToday: number;
    dailyGoalHours: number;
    weeklyAverageLabel: string;
    weeklyAverageValue: string;
  };
  tutorSuggestions: {
    title: string;
    subtitle: string;
    items: DashboardSuggestion[];
  };
  competencyMap: {
    title: string;
    subtitle: string;
    data: DashboardMetricPoint[];
  };
  certification: {
    title: string;
    progressPercent: number;
    tierLabel: string;
    subtitle: string;
    items: DashboardCertificationItem[];
  };
}

export interface DashboardApiResponse {
  header: DashboardViewData['header'];
  navigation: DashboardNavItem[];
  hero: DashboardViewData['hero'];
  engineProgress: DashboardViewData['engineProgress'];
  sync: DashboardViewData['sync'];
  activity: DashboardViewData['activity'];
  dailyProgress: DashboardViewData['dailyProgress'];
  tutorSuggestions: DashboardViewData['tutorSuggestions'];
  competencyMap: DashboardViewData['competencyMap'];
  certification: DashboardViewData['certification'];
}

export function mapDashboardApiToViewData(api: DashboardApiResponse): DashboardViewData {
  return api;
}

function buildDashboardApiResponse(brand: BrandConfig): DashboardApiResponse {
  return {
    header: {
      title: brand.dashboardGreeting,
      subtitle: brand.dashboardSubtext,
      searchPlaceholder: 'Search courses, topics, or mentors...',
      streakLabel: 'Streak',
      streakCount: 14,
      userName: 'Alex K.',
      userRole: 'Premium',
      userInitials: 'AK',
    },
    navigation: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Exam Engine', href: '/launch-exam' },
      { label: 'Tutorial Engine', href: '/tutorial' },
      { label: 'Node Map', href: '/node-map' },
      { label: 'Certificates', href: '/certificates' },
      { label: 'Settings', href: '/settings' },
    ],
    hero: {
      badge: brand.dashboardGreeting,
      title: `Resume ${brand.tutorLabel} Session`,
      description: 'Continue your remediation for Linked Lists & Trees',
      ctaLabel: 'Start Learning Now',
    },
    engineProgress: {
      title: 'Learning Engine Progress',
      steps: [
        { label: 'Diagnostic', completed: true },
        { label: 'Analysis', completed: true },
        { label: 'Tutor', completed: true },
        { label: 'Code', completed: false },
        { label: 'Master', completed: false },
        { label: 'Certify', completed: false },
      ],
    },
    sync: {
      title: 'Engine Synchronization',
      topics: [
        { title: 'Linked Lists Architecture', status: 'failed', score: 45, action: 'Start Tutorial' },
        { title: 'Async Await Promises', status: 'weak', score: 68, action: 'Review Concepts' },
        { title: 'Map & Filter Recursion', status: 'mastered', score: 94, action: 'Advanced Level' },
      ],
      ctaLabel: 'Auto-Deploy Tutorial Sequence',
    },
    activity: {
      title: 'Recent Activity',
      items: [
        { title: 'Passed JavaScript Hooks Exam', description: 'Scored 82% on React Hooks Mastery', time: '2 hours ago', tone: 'success' },
        { title: 'Scheduled Live Mentorship', description: 'Tuesday, 3:00 PM - Advanced Python', time: '4 hours ago', tone: 'info' },
        { title: 'Skill Level Increased', description: 'Data Structures: Intermediate to Advanced', time: '1 day ago', tone: 'accent' },
        { title: 'Completed Coding Challenge', description: 'Binary Tree Traversal - 45 minutes', time: '2 days ago', tone: 'warning' },
      ],
    },
    dailyProgress: {
      title: 'Daily Progress',
      hoursToday: 4,
      dailyGoalHours: 6,
      weeklyAverageLabel: 'Weekly Average',
      weeklyAverageValue: '3.8 hrs',
    },
    tutorSuggestions: {
      title: `${brand.tutorLabel} Suggestions`,
      subtitle: 'Recommends based on performance',
      items: [
        { title: 'Finish "React State Management"', description: 'Learning about react learning paths.', tone: 'accent', ctaLabel: 'Start' },
        { title: 'Start "GraphQL Basics"', description: 'Practice react on learning performance.', tone: 'info', ctaLabel: 'Start' },
        { title: 'Practice "Recursion"', description: 'Practice recursion performance.', tone: 'warning', ctaLabel: 'Start' },
      ],
    },
    competencyMap: {
      title: 'Competency Map',
      subtitle: 'Based on exam performance metrics',
      data: [
        { subject: 'Logic', value: 85, fullMark: 100 },
        { subject: 'Syntax', value: 92, fullMark: 100 },
        { subject: 'Memory', value: 78, fullMark: 100 },
        { subject: 'Speed', value: 88, fullMark: 100 },
        { subject: 'Debugging', value: 75, fullMark: 100 },
        { subject: 'Architecture', value: 82, fullMark: 100 },
      ],
    },
    certification: {
      title: 'Certification Progress',
      progressPercent: 75,
      tierLabel: 'Tier 2 Certification',
      subtitle: 'Complete 2 more exams to unlock',
      items: [
        { label: 'Advanced Python', status: 'completed' },
        { label: 'React Hooks', status: 'completed' },
        { label: 'Data Structures', status: 'pending' },
      ],
    },
  };
}

export async function loadDashboardData(brand: BrandConfig): Promise<DashboardViewData> {
  const apiResponse = buildDashboardApiResponse(brand);
  return mapDashboardApiToViewData(apiResponse);
}
