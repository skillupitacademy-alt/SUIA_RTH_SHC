import { fetchBackendAuthState } from './auth/serverAuthState';
import { BrandConfig } from './brandConfig';
import { domainCards, goalCards } from './OnboardingEngine/models/onboardingSession';
import { PersistedOnboardingSession } from './onboardingSessionCookie';

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
  viewer: {
    headline: string;
    supporting_copy: string;
    search_placeholder: string;
    streak: {
      label: string;
      current_count: number;
    };
    membership: {
      display_name: string;
      tier_label: string;
      initials: string;
    };
  };
  nav_items: Array<{
    label: string;
    url: string;
  }>;
  hero_card: {
    eyebrow: string;
    headline: string;
    body: string;
    primary_action_label: string;
  };
  engine_overview: {
    section_title: string;
    milestones: Array<{
      name: string;
      is_complete: boolean;
    }>;
  };
  synchronization_panel: {
    section_title: string;
    entries: Array<{
      topic_name: string;
      mastery_state: 'failed' | 'weak' | 'mastered';
      score_percent: number;
      next_action_label: string;
    }>;
    primary_action_label: string;
  };
  activity_feed: {
    section_title: string;
    entries: Array<{
      headline: string;
      supporting_copy: string;
      relative_time: string;
      visual_tone: 'success' | 'info' | 'accent' | 'warning';
    }>;
  };
  daily_progress_summary: {
    section_title: string;
    hours_today: number;
    daily_goal_hours: number;
    secondary_stat_label: string;
    secondary_stat_value: string;
  };
  recommendation_panel: {
    section_title: string;
    supporting_copy: string;
    recommendations: Array<{
      headline: string;
      supporting_copy: string;
      visual_tone: 'accent' | 'info' | 'warning';
      cta_label: string;
    }>;
  };
  competency_chart: {
    section_title: string;
    supporting_copy: string;
    metrics: Array<{
      label: string;
      score: number;
      max_score: number;
    }>;
  };
  certification_tracker: {
    section_title: string;
    completion_percent: number;
    tier_name: string;
    helper_copy: string;
    items: Array<{
      label: string;
      state: 'completed' | 'pending';
    }>;
  };
  onboarding_session: PersistedOnboardingSession | null;
}

const timeCommitmentToDailyGoalHours: Record<string, number> = {
  '30 min/day': 0.5,
  '1 hr/day': 1,
  '2 hrs/day': 2,
  'Weekends only': 1,
  '5-7 hrs/week': 1,
};

const timeCommitmentToWeeklyAverage: Record<string, string> = {
  '30 min/day': '3.5 hrs',
  '1 hr/day': '7 hrs',
  '2 hrs/day': '14 hrs',
  'Weekends only': '6 hrs',
  '5-7 hrs/week': '6 hrs',
};

function getGoalMeta(goalId: string | undefined) {
  return goalCards.find((goal) => goal.id === goalId);
}

function getDomainMeta(domainId: string | undefined) {
  return domainCards.find((domain) => domain.id === domainId);
}

function getFirstName(fullName: string | undefined) {
  const value = fullName?.trim();
  if (!value) {
    return 'Learner';
  }

  return value.split(/\s+/)[0];
}

function getInitials(fullName: string | undefined) {
  const value = fullName?.trim();
  if (!value) {
    return 'LP';
  }

  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'LP';
}

function formatSkillLevel(skillLevel: PersistedOnboardingSession['skillLevel'] | undefined) {
  if (!skillLevel) {
    return 'Guided Plan';
  }

  return `${skillLevel[0].toUpperCase()}${skillLevel.slice(1)} Plan`;
}

function getFocusArea(onboardingSession: PersistedOnboardingSession | null) {
  if (!onboardingSession) {
    return 'your next milestone';
  }

  return onboardingSession.subDomain || getDomainMeta(onboardingSession.domain)?.title || 'your next milestone';
}

function getGoalLabel(onboardingSession: PersistedOnboardingSession | null) {
  return getGoalMeta(onboardingSession?.primaryGoal)?.title || 'Personalized Learning';
}

function getStatusLabel(onboardingSession: PersistedOnboardingSession | null) {
  if (!onboardingSession) {
    return 'Active Learner';
  }

  const persona = onboardingSession.status === 'professional' ? 'Professional' : 'Student';
  return `${persona} • ${formatSkillLevel(onboardingSession.skillLevel)}`;
}

function getDailyProgressSummary(onboardingSession: PersistedOnboardingSession | null) {
  const dailyGoalHours = timeCommitmentToDailyGoalHours[onboardingSession?.timeCommitment ?? ''] ?? 1;
  const hoursToday = onboardingSession?.journeyStatus === 'completed' ? Math.max(0.5, dailyGoalHours / 2) : 0;
  const weeklyAverageValue =
    timeCommitmentToWeeklyAverage[onboardingSession?.timeCommitment ?? ''] ?? '5 hrs';

  return {
    dailyGoalHours,
    hoursToday,
    weeklyAverageValue,
  };
}

function buildSyncEntries(onboardingSession: PersistedOnboardingSession | null): DashboardApiResponse['synchronization_panel']['entries'] {
  const domain = getDomainMeta(onboardingSession?.domain);
  const focusArea = getFocusArea(onboardingSession);
  const backupTopics = ['Core Concepts', 'Practice Sprint', 'Applied Review'];
  const topics = [
    onboardingSession?.subDomain,
    ...(domain?.subDomains ?? []),
    ...backupTopics,
  ]
    .filter((topic, index, values): topic is string => Boolean(topic) && values.indexOf(topic) === index)
    .slice(0, 3);

  const statusBySkillLevel: Record<
    PersistedOnboardingSession['skillLevel'],
    DashboardApiResponse['synchronization_panel']['entries'][number]['mastery_state'][]
  > = {
    beginner: ['failed', 'weak', 'weak'],
    intermediate: ['weak', 'weak', 'mastered'],
    advanced: ['mastered', 'mastered', 'weak'],
  };

  const scoreBySkillLevel: Record<PersistedOnboardingSession['skillLevel'], number[]> = {
    beginner: [42, 58, 64],
    intermediate: [68, 76, 88],
    advanced: [90, 94, 79],
  };

  const skillLevel = onboardingSession?.skillLevel ?? 'beginner';
  const statuses = statusBySkillLevel[skillLevel];
  const scores = scoreBySkillLevel[skillLevel];

  return topics.map((topic, index) => ({
    topic_name: index === 0 ? focusArea : topic,
    mastery_state: statuses[index] ?? 'weak',
    score_percent: scores[index] ?? 65,
    next_action_label:
      index === 0 ? 'Open Learning Path' : index === 1 ? 'Review Concepts' : 'Practice Now',
  }));
}

function buildActivityEntries(
  brand: BrandConfig,
  onboardingSession: PersistedOnboardingSession | null,
): DashboardApiResponse['activity_feed']['entries'] {
  const goalLabel = getGoalLabel(onboardingSession);
  const domainLabel = getDomainMeta(onboardingSession?.domain)?.title || 'Learning Track';
  const focusArea = getFocusArea(onboardingSession);
  const schedule = onboardingSession?.timeCommitment || 'Daily practice';
  const profileName = onboardingSession?.fullName || 'Learning profile';
  const activityEntries: DashboardApiResponse['activity_feed']['entries'] = [
    {
      headline:
        onboardingSession?.journeyStatus === 'completed'
          ? 'Completed onboarding setup'
          : 'Started onboarding setup',
      supporting_copy: `${profileName} is now aligned to ${goalLabel.toLowerCase()}.`,
      relative_time: 'Just now',
      visual_tone: 'success',
    },
    {
      headline: `Selected ${domainLabel} track`,
      supporting_copy: `Primary focus: ${focusArea}.`,
      relative_time: 'Just now',
      visual_tone: 'info',
    },
    {
      headline: `${formatSkillLevel(onboardingSession?.skillLevel)} activated`,
      supporting_copy: `${brand.tutorLabel} guidance is now tuned for ${schedule.toLowerCase()}.`,
      relative_time: '1 minute ago',
      visual_tone: 'accent',
    },
    {
      headline: 'Next session queued',
      supporting_copy: `Start with ${focusArea} to build momentum this week.`,
      relative_time: '2 minutes ago',
      visual_tone: 'warning',
    },
  ];

  return activityEntries;
}

function buildRecommendationEntries(
  brand: BrandConfig,
  onboardingSession: PersistedOnboardingSession | null,
): DashboardApiResponse['recommendation_panel']['recommendations'] {
  const focusArea = getFocusArea(onboardingSession);
  const goalLabel = getGoalLabel(onboardingSession);
  const domainLabel = getDomainMeta(onboardingSession?.domain)?.title || 'Learning Track';
  const schedule = onboardingSession?.timeCommitment || '1 hr/day';

  return [
    {
      headline: `Start your ${focusArea} path`,
      supporting_copy: `Begin the first guided module for ${domainLabel.toLowerCase()}.`,
      visual_tone: 'accent',
      cta_label: 'Start',
    },
    {
      headline: `Use ${brand.tutorLabel} for ${goalLabel.toLowerCase()}`,
      supporting_copy: `Ask for a study plan that fits ${schedule.toLowerCase()}.`,
      visual_tone: 'info',
      cta_label: 'Ask Now',
    },
    {
      headline: 'Lock in your first milestone',
      supporting_copy: `Finish one focused practice block to move from setup to active learning.`,
      visual_tone: 'warning',
      cta_label: 'Continue',
    },
  ];
}

export function mapDashboardApiToViewData(api: DashboardApiResponse): DashboardViewData {
  return {
    header: {
      title: api.viewer.headline,
      subtitle: api.viewer.supporting_copy,
      searchPlaceholder: api.viewer.search_placeholder,
      streakLabel: api.viewer.streak.label,
      streakCount: api.viewer.streak.current_count,
      userName: api.viewer.membership.display_name,
      userRole: api.viewer.membership.tier_label,
      userInitials: api.viewer.membership.initials,
    },
    navigation: api.nav_items.map((item) => ({
      label: item.label,
      href: item.url,
    })),
    hero: {
      badge: api.hero_card.eyebrow,
      title: api.hero_card.headline,
      description: api.hero_card.body,
      ctaLabel: api.hero_card.primary_action_label,
    },
    engineProgress: {
      title: api.engine_overview.section_title,
      steps: api.engine_overview.milestones.map((milestone) => ({
        label: milestone.name,
        completed: milestone.is_complete,
      })),
    },
    sync: {
      title: api.synchronization_panel.section_title,
      topics: api.synchronization_panel.entries.map((entry) => ({
        title: entry.topic_name,
        status: entry.mastery_state,
        score: entry.score_percent,
        action: entry.next_action_label,
      })),
      ctaLabel: api.synchronization_panel.primary_action_label,
    },
    activity: {
      title: api.activity_feed.section_title,
      items: api.activity_feed.entries.map((entry) => ({
        title: entry.headline,
        description: entry.supporting_copy,
        time: entry.relative_time,
        tone: entry.visual_tone,
      })),
    },
    dailyProgress: {
      title: api.daily_progress_summary.section_title,
      hoursToday: api.daily_progress_summary.hours_today,
      dailyGoalHours: api.daily_progress_summary.daily_goal_hours,
      weeklyAverageLabel: api.daily_progress_summary.secondary_stat_label,
      weeklyAverageValue: api.daily_progress_summary.secondary_stat_value,
    },
    tutorSuggestions: {
      title: api.recommendation_panel.section_title,
      subtitle: api.recommendation_panel.supporting_copy,
      items: api.recommendation_panel.recommendations.map((recommendation) => ({
        title: recommendation.headline,
        description: recommendation.supporting_copy,
        tone: recommendation.visual_tone,
        ctaLabel: recommendation.cta_label,
      })),
    },
    competencyMap: {
      title: api.competency_chart.section_title,
      subtitle: api.competency_chart.supporting_copy,
      data: api.competency_chart.metrics.map((metric) => ({
        subject: metric.label,
        value: metric.score,
        fullMark: metric.max_score,
      })),
    },
    certification: {
      title: api.certification_tracker.section_title,
      progressPercent: api.certification_tracker.completion_percent,
      tierLabel: api.certification_tracker.tier_name,
      subtitle: api.certification_tracker.helper_copy,
      items: api.certification_tracker.items.map((item) => ({
        label: item.label,
        status: item.state,
      })),
    },
  };
}

function buildDashboardApiResponse(
  brand: BrandConfig,
  onboardingSession: PersistedOnboardingSession | null,
): DashboardApiResponse {
  const focusArea = getFocusArea(onboardingSession);
  const goalLabel = getGoalLabel(onboardingSession);
  const domainLabel = getDomainMeta(onboardingSession?.domain)?.title || 'your selected track';
  const dailyProgress = getDailyProgressSummary(onboardingSession);
  const learnerName = onboardingSession?.fullName || 'Learner Profile';
  const firstName = getFirstName(onboardingSession?.fullName);
  const searchPlaceholder = onboardingSession
    ? `Search ${focusArea}, practice sets, or ${brand.tutorLabel.toLowerCase()} guidance...`
    : `Search courses, topics, or ${brand.tutorLabel.toLowerCase()} guidance...`;

  return {
    viewer: {
      headline: onboardingSession
        ? `Welcome back, ${firstName}`
        : brand.dashboardGreeting,
      supporting_copy: onboardingSession
        ? `Your ${goalLabel.toLowerCase()} plan for ${focusArea} is ready to continue.`
        : brand.dashboardSubtext,
      search_placeholder: searchPlaceholder,
      streak: {
        label: 'Streak',
        current_count: onboardingSession?.journeyStatus === 'completed' ? 1 : 0,
      },
      membership: {
        display_name: learnerName,
        tier_label: getStatusLabel(onboardingSession),
        initials: getInitials(onboardingSession?.fullName),
      },
    },
    nav_items: [
      { label: 'Dashboard', url: '/dashboard' },
      { label: 'Exam Engine', url: '/launch-exam' },
      { label: 'Tutorial Engine', url: '/tutorial' },
      { label: 'Node Map', url: '/node-map' },
      { label: 'Certificates', url: '/certificates' },
      { label: 'Settings', url: '/settings' },
    ],
    hero_card: {
      eyebrow: onboardingSession ? `${goalLabel} Journey` : brand.dashboardGreeting,
      headline: onboardingSession
        ? `Continue with ${brand.tutorLabel}`
        : `Resume ${brand.tutorLabel} Session`,
      body: onboardingSession
        ? `Start your next guided step in ${focusArea} and build toward ${goalLabel.toLowerCase()}.`
        : 'Continue your remediation for Linked Lists & Trees',
      primary_action_label: onboardingSession ? 'Open My Learning Path' : 'Start Learning Now',
    },
    engine_overview: {
      section_title: 'Learning Engine Progress',
      milestones: [
        { name: 'Diagnostic', is_complete: Boolean(onboardingSession) },
        { name: 'Analysis', is_complete: onboardingSession?.journeyStatus === 'completed' },
        { name: 'Tutor', is_complete: onboardingSession?.journeyStatus === 'completed' },
        { name: 'Code', is_complete: false },
        { name: 'Master', is_complete: false },
        { name: 'Certify', is_complete: false },
      ],
    },
    synchronization_panel: {
      section_title: 'Engine Synchronization',
      entries: buildSyncEntries(onboardingSession),
      primary_action_label: onboardingSession ? 'Deploy Personalized Sequence' : 'Auto-Deploy Tutorial Sequence',
    },
    activity_feed: {
      section_title: 'Recent Activity',
      entries: buildActivityEntries(brand, onboardingSession),
    },
    daily_progress_summary: {
      section_title: 'Daily Progress',
      hours_today: dailyProgress.hoursToday,
      daily_goal_hours: dailyProgress.dailyGoalHours,
      secondary_stat_label: 'Weekly Average',
      secondary_stat_value: dailyProgress.weeklyAverageValue,
    },
    recommendation_panel: {
      section_title: `${brand.tutorLabel} Suggestions`,
      supporting_copy: onboardingSession
        ? `Recommended for your ${goalLabel.toLowerCase()} plan in ${domainLabel.toLowerCase()}.`
        : 'Recommends based on performance',
      recommendations: buildRecommendationEntries(brand, onboardingSession),
    },
    competency_chart: {
      section_title: 'Competency Map',
      supporting_copy: onboardingSession
        ? `Baseline generated from your ${formatSkillLevel(onboardingSession.skillLevel).toLowerCase()} and onboarding selections.`
        : 'Based on exam performance metrics',
      metrics: [
        {
          label: 'Foundations',
          score: onboardingSession?.skillLevel === 'advanced' ? 88 : onboardingSession?.skillLevel === 'intermediate' ? 74 : 58,
          max_score: 100,
        },
        {
          label: 'Practice',
          score: onboardingSession?.timeCommitment === '2 hrs/day' ? 86 : onboardingSession ? 72 : 60,
          max_score: 100,
        },
        {
          label: 'Consistency',
          score: onboardingSession?.journeyStatus === 'completed' ? 82 : 55,
          max_score: 100,
        },
        {
          label: 'Guidance Fit',
          score: onboardingSession ? 90 : 65,
          max_score: 100,
        },
        {
          label: 'Exam Readiness',
          score: onboardingSession?.primaryGoal === 'crack-exams' ? 84 : 63,
          max_score: 100,
        },
        {
          label: 'Career Alignment',
          score:
            onboardingSession?.primaryGoal === 'get-job-ready' ||
            onboardingSession?.primaryGoal === 'switch-career'
              ? 87
              : 69,
          max_score: 100,
        },
      ],
    },
    certification_tracker: {
      section_title: 'Certification Progress',
      completion_percent: onboardingSession?.journeyStatus === 'completed' ? 20 : 0,
      tier_name: onboardingSession ? `${formatSkillLevel(onboardingSession.skillLevel)} Track` : 'Tier 1 Certification',
      helper_copy: onboardingSession
        ? `Complete your first ${focusArea} module to unlock the next milestone.`
        : 'Complete your first guided session to unlock',
      items: [
        { label: 'Complete onboarding profile', state: onboardingSession ? 'completed' : 'pending' },
        { label: `Start ${focusArea} learning path`, state: 'pending' },
        { label: `Reach first ${goalLabel.toLowerCase()} checkpoint`, state: 'pending' },
      ],
    },
    onboarding_session: onboardingSession,
  };
}

export async function loadDashboardData(brand: BrandConfig): Promise<DashboardViewData> {
  const user = await fetchBackendAuthState();
  const onboardingSession: PersistedOnboardingSession | null =
    user === null
      ? null
      : {
          fullName: user.fullName ?? user.name ?? '',
          educationLevel: user.educationLevel ?? '',
          status: user.status === 'professional' ? 'professional' : 'student',
          primaryGoal: user.primaryGoal ?? '',
          domain: user.domain ?? '',
          subDomain: user.subDomain ?? '',
          skillLevel: user.skillLevel ?? 'beginner',
          timeCommitment: user.timeCommitment ?? '',
          journeyStatus:
            user.journeyStatus === 'completed' ||
            user.journeyStatus === 'skipped' ||
            user.journeyStatus === 'in_progress' ||
            user.journeyStatus === 'not_started'
              ? user.journeyStatus
              : user.onboardingCompleted === true
              ? 'completed'
              : 'not_started',
          updatedAt: new Date().toISOString(),
        };
  const apiResponse = buildDashboardApiResponse(brand, onboardingSession);

  return mapDashboardApiToViewData(apiResponse);
}
