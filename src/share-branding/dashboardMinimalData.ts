import type { BrandConfig } from './brandConfig';
import type { DashboardViewData } from './dashboardPageData';

/**
 * 🔥 PHASE 1: PURE FALLBACK DATA BUILDER
 * 
 * CRITICAL RULES:
 * ❌ MUST NOT call fetch/unifiedFetch/database
 * ✅ MUST be synchronous
 * ✅ MUST return same shape as loadDashboardData
 * ✅ MUST be completely independent of API failures
 * 
 * PURPOSE: Provide stable fallback when API/DB fails
 * PRINCIPLE: "Fallback UI must be independent of the system that just failed"
 */
export function getMinimalDashboardData(config: BrandConfig): DashboardViewData & { isFallback: true } {
  return {
    isFallback: true, // 🔥 Flag for UI to show degraded state banner
    header: {
      title: 'Welcome back',
      subtitle: "We're preparing your dashboard...",
      searchPlaceholder: `Search ${config.name}...`,
      streakLabel: 'Streak',
      streakCount: 0,
      userName: 'Learner',
      userRole: 'Active Learner',
      userInitials: 'LP',
    },
    navigation: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/dashboard/profile' },
      { label: 'Exam Engine', href: '/launch-exam' },
      { label: 'Tutorial Engine', href: '/tutorial' },
      { label: 'Node Map', href: '/node-map' },
      { label: 'Certificates', href: '/certificates' },
      { label: 'Settings', href: '/settings' },
    ],
    hero: {
      badge: config.dashboardGreeting,
      title: `Resume ${config.tutorLabel} Session`,
      description: 'Your personalized learning experience is being prepared',
      ctaLabel: 'Start Learning Now',
    },
    engineProgress: {
      title: 'Learning Engine Progress',
      steps: [
        { label: 'Diagnostic', completed: false },
        { label: 'Analysis', completed: false },
        { label: 'Tutor', completed: false },
        { label: 'Code', completed: false },
        { label: 'Master', completed: false },
        { label: 'Certify', completed: false },
      ],
    },
    sync: {
      title: 'Engine Synchronization',
      topics: [
        {
          title: 'Core Concepts',
          status: 'weak',
          score: 0,
          action: 'Start Learning',
        },
      ],
      ctaLabel: 'Auto-Deploy Tutorial Sequence',
    },
    activity: {
      title: 'Recent Activity',
      items: [
        {
          title: 'Dashboard loading',
          description: 'Your activity feed will appear here',
          time: 'Just now',
          tone: 'info',
        },
      ],
    },
    dailyProgress: {
      title: 'Daily Progress',
      hoursToday: 0,
      dailyGoalHours: 1,
      weeklyAverageLabel: 'Weekly Average',
      weeklyAverageValue: '0 hrs',
    },
    tutorSuggestions: {
      title: `${config.tutorLabel} Suggestions`,
      subtitle: 'Recommendations will appear here',
      items: [
        {
          title: 'Complete your profile',
          description: 'Set up your learning preferences for personalized recommendations',
          tone: 'accent',
          ctaLabel: 'Get Started',
        },
      ],
    },
    competencyMap: {
      title: 'Competency Map',
      subtitle: 'Your skill assessment will appear here',
      data: [
        { subject: 'Foundations', value: 0, fullMark: 100 },
        { subject: 'Practice', value: 0, fullMark: 100 },
        { subject: 'Consistency', value: 0, fullMark: 100 },
        { subject: 'Guidance Fit', value: 0, fullMark: 100 },
        { subject: 'Exam Readiness', value: 0, fullMark: 100 },
        { subject: 'Career Alignment', value: 0, fullMark: 100 },
      ],
    },
    certification: {
      title: 'Certification Progress',
      progressPercent: 0,
      tierLabel: 'Getting Started',
      subtitle: 'Complete your first session to begin tracking progress',
      items: [
        { label: 'Complete profile setup', status: 'pending' },
        { label: 'Start learning path', status: 'pending' },
        { label: 'Reach first checkpoint', status: 'pending' },
      ],
    },
  };
}
