import { BrandConfig } from './brandConfig';

export interface DashboardNavItem {
  label: string;
  href: string;
  badge?: string;
}

export interface DashboardDomainItem {
  id: string;
  title: string;
  description: string;
  percent: number;
  stats: {
    topics: number;
    projects: number;
    exams: number;
  };
  careerOutcomes: string[];
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  isPopular?: boolean;
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
  statusLabel: string;
  score: number;
  actionLabel: string;
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
      title: brand.tutorialDashboardTitle,
      subtitle: brand.tutorialDashboardSubtitle,
      streakLabel: 'Day Streak',
      streakCount: 16,
      searchPlaceholder: brand.tutorialDashboardSearchPlaceholder,
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
        { 
          id: '1', 
          title: 'Full Stack Development', 
          description: 'Master both frontend and backend technologies to build complete web applications.',
          percent: 68, 
          stats: { topics: 42, projects: 18, exams: 6 },
          careerOutcomes: ['Full Stack Developer', 'Software Engineer', 'Tech Lead'],
          skillLevel: 'Advanced',
          isPopular: true
        },
        { 
          id: '2', 
          title: 'Data Science', 
          description: 'Learn data analysis, machine learning and visualization to extract insights from data.',
          percent: 45, 
          stats: { topics: 42, projects: 15, exams: 5 },
          careerOutcomes: ['Data Scientist', 'ML Engineer', 'Data Analyst'],
          skillLevel: 'Intermediate',
          isPopular: true
        },
        { 
          id: '3', 
          title: 'Data Engineering', 
          description: 'Build scalable data pipelines and infrastructure for big data applications.',
          percent: 32, 
          stats: { topics: 35, projects: 14, exams: 4 },
          careerOutcomes: ['Data Engineer', 'Big Data Engineer', 'ETL Developer'],
          skillLevel: 'Intermediate'
        },
        { 
          id: '4', 
          title: 'DevOps Engineering', 
          description: 'Learn deployment, CI/CD, containerization and infrastructure automation.',
          percent: 40, 
          stats: { topics: 32, projects: 12, exams: 4 },
          careerOutcomes: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Engineer'],
          skillLevel: 'Beginner'
        },
        { 
          id: '5', 
          title: 'AI / Machine Learning', 
          description: 'Explore artificial intelligence, deep learning and neural networks.',
          percent: 28, 
          stats: { topics: 33, projects: 11, exams: 4 },
          careerOutcomes: ['AI Engineer', 'ML Engineer', 'Research Scientist'],
          skillLevel: 'Beginner',
          isPopular: true
        },
        { 
          id: '6', 
          title: 'Cybersecurity Engineering', 
          description: 'Learn ethical hacking, network security and security best practices.',
          percent: 35, 
          stats: { topics: 30, projects: 10, exams: 4 },
          careerOutcomes: ['Security Analyst', 'Ethical Hacker', 'SOC Analyst'],
          skillLevel: 'Beginner'
        },
      ],
    },
    engineSync: {
      topics: [
        { title: 'Backend Development', status: 'failed', statusLabel: 'FAILED EXAM', score: 42, actionLabel: 'Open Learning Path' },
        { title: 'Core Concepts', status: 'weak', statusLabel: 'WEAK DIAGNOSTIC', score: 58, actionLabel: 'Review Concepts' },
        { title: 'Practice Sprint', status: 'weak', statusLabel: 'WEAK DIAGNOSTIC', score: 64, actionLabel: 'Practice Now' },
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
