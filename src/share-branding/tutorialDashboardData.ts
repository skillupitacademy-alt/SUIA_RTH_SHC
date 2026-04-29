import { BrandConfig } from './brandConfig';

export interface DashboardNavItem {
  label: string;
  href: string;
  badge?: string;
}

export interface DashboardDomainItem {
  id: string;
  title: string;
  percent: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  completedSubjects: number;
  totalSubjects: number;
}

export interface DashboardSubjectProgress {
  subject: string;
  percent: number;
  tone: 'primary' | 'success' | 'info' | 'accent' | 'warning' | 'danger';
}

export interface DashboardAssignmentItem {
  id: string;
  title: string;
  category: string;
  dueText: string;
}

export interface DashboardProjectItem {
  id: string;
  title: string;
  type: string;
  percent: number;
}

export interface DashboardSyncTopic {
  title: string;
  status: 'failed' | 'weak' | 'mastered';
  subtext: string;
}

export interface TutorialDashboardViewData {
  header: {
    title: string;
    subtitle: string;
    streakLabel: string;
    streakCount: number;
    searchPlaceholder: string;
    xpPoints: string;
    level: number;
    levelRole: string;
    userName: string;
    userRole: string;
    userInitials: string;
  };
  navigation: DashboardNavItem[];
  hero: {
    greeting: string;
    subGreeting: string;
    continueTitle: string;
    continueContext: string;
    continuePercent: number;
    progressTimeSpent: string;
    progressLessons: number;
    progressDailyGoal: number;
    progressXpEarned: string;
  };
  learningProgress: {
    overallPercent: number;
    subjects: DashboardSubjectProgress[];
  };
  myDomains: {
    items: DashboardDomainItem[];
  };
  engineSync: {
    topics: DashboardSyncTopic[];
  };
  assignments: {
    pendingCount: number;
    items: DashboardAssignmentItem[];
  };
  projects: {
    items: DashboardProjectItem[];
  };
  career: {
    resumeScore: number;
    resumeStatus: string;
    skillsMatch: number;
    skillsStatus: string;
    jobApplications: number;
    certCompleted: number;
    certTotal: number;
  };
}

export function buildTutorialDashboardData(brand: BrandConfig): TutorialDashboardViewData {
  const firstName = 'Suresh';

  return {
    header: {
      title: 'Tutorial Engine Dashboard',
      subtitle: 'Your personalized learning command center',
      streakLabel: 'Day Streak',
      streakCount: 16,
      searchPlaceholder: 'Search courses, topics...',
      xpPoints: '2,450',
      level: 12,
      levelRole: 'Advanced Learner',
      userName: `Hi, ${firstName}`,
      userRole: 'Learner',
      userInitials: 'S',
    },
    navigation: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Domains', href: '/tutorial/domains' },
      { label: 'Subjects', href: '/tutorial/subjects' },
      { label: 'Topics', href: '/tutorial/topics' },
      { label: 'My Learning', href: '/tutorial/learning' },
      { label: brand.tutorLabel, href: '/tutorial/tutor', badge: 'New' },
      { label: 'Assignments', href: '/tutorial/assignments' },
      { label: 'Projects', href: '/tutorial/projects' },
      { label: 'Bookmarks', href: '/tutorial/bookmarks' },
      { label: 'Notes', href: '/tutorial/notes' },
      { label: 'Launch Exam', href: '/launch-exam' },
      { label: 'Practice Tests', href: '/tutorial/practice' },
      { label: 'My Results', href: '/tutorial/results' },
      { label: 'Career Readiness', href: '/tutorial/career' },
      { label: 'Resume Builder', href: '/tutorial/resume' },
      { label: 'Certifications', href: '/tutorial/certifications' },
    ],
    hero: {
      greeting: `Welcome back, ${firstName}! 👋`,
      subGreeting: "Keep going! You're making excellent progress in your learning journey.",
      continueTitle: 'Async/Await in JavaScript',
      continueContext: 'JavaScript Essentials > Async Programming',
      continuePercent: 65,
      progressTimeSpent: '2.3 hrs',
      progressLessons: 4,
      progressDailyGoal: 75,
      progressXpEarned: '+320',
    },
    learningProgress: {
      overallPercent: 68,
      subjects: [
        { subject: 'Frontend Development', percent: 72, tone: 'primary' },
        { subject: 'Backend Development', percent: 65, tone: 'success' },
        { subject: 'Database Management', percent: 60, tone: 'info' },
        { subject: 'DevOps Basics', percent: 48, tone: 'accent' },
      ],
    },
    myDomains: {
      items: [
        { id: '1', title: 'Full Stack Development', percent: 72, skillLevel: 'Advanced', completedSubjects: 8, totalSubjects: 12 },
        { id: '2', title: 'Data Science', percent: 48, skillLevel: 'Intermediate', completedSubjects: 5, totalSubjects: 10 },
        { id: '3', title: 'Data Engineering', percent: 35, skillLevel: 'Beginner', completedSubjects: 3, totalSubjects: 9 },
        { id: '4', title: 'DevOps', percent: 28, skillLevel: 'Beginner', completedSubjects: 2, totalSubjects: 7 },
        { id: '5', title: 'AI & Machine Learning', percent: 22, skillLevel: 'Beginner', completedSubjects: 2, totalSubjects: 8 },
        { id: '6', title: 'Cybersecurity', percent: 15, skillLevel: 'Beginner', completedSubjects: 1, totalSubjects: 6 },
      ],
    },
    engineSync: {
      topics: [
        { title: 'Linked Lists in DSA', status: 'failed', subtext: 'Failed in Exam' },
        { title: 'Async/Await Concepts', status: 'weak', subtext: 'Weak in Diagnostic' },
        { title: 'React Components', status: 'mastered', subtext: 'Fully Mastered' },
      ],
    },
    assignments: {
      pendingCount: 3,
      items: [
        { id: 'a1', title: 'Build a To-Do App with React', category: 'React Basics', dueText: 'Due in 2 days' },
        { id: 'a2', title: 'Implement JWT Authentication', category: 'Backend Security', dueText: 'Due in 4 days' },
        { id: 'a3', title: 'SQL Join Operations Practice', category: 'Database Queries', dueText: 'Due in 6 days' },
      ],
    },
    projects: {
      items: [
        { id: 'p1', title: 'E-Commerce Platform', type: 'Full Stack Project', percent: 65 },
        { id: 'p2', title: 'Chat Application', type: 'Real-time Project', percent: 40 },
        { id: 'p3', title: 'Portfolio Website', type: 'Frontend Project', percent: 20 },
      ],
    },
    career: {
      resumeScore: 78,
      resumeStatus: 'Good',
      skillsMatch: 82,
      skillsStatus: 'High',
      jobApplications: 12,
      certCompleted: 5,
      certTotal: 8,
    },
  };
}
