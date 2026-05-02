import { BrandConfig } from './brandConfig';

export interface ContentCardData {
  id: string;
  title: string;
  type: 'notes' | 'layman' | 'example' | 'code' | 'deep-dive' | 'visual' | 'task' | 'practice' | 'assignment' | 'project' | 'quiz';
  content?: string;
  code?: string;
  ctaLabel: string;
  badge?: {
    text: string;
    type: 'success' | 'warning' | 'info';
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface Weakness {
  id: string;
  topic: string;
  status: string;
  color: string;
}

export interface SubtopicViewData {
  nav: {
    courseLabel: string;
    lessonLabel: string;
    dashboardCtaLabel: string;
    streak: number;
    xpPoints: number;
    learnerInitials: string;
  };
  subtopic: {
    title: string;
    description: string;
    progress: number; // For Header
    progressLabel: string; // For Header
    metadata: {
      level: string;
      readingTime: string;
      xp: number;
      topicsCount: number;
      lastUpdated: string;
    };
    stats: { id: string; label: string; value: string; icon: string }[];
    overallProgress: {
      percentage: number;
      checklist: { label: string; completed: boolean }[];
    };
    sidebar: {
      subtopicsTitle: string;
      items: {
        id: string;
        title: string;
        status: 'completed' | 'active' | 'locked';
        isCurrent?: boolean;
      }[];
    };
    tabs: { id: string; label: string; icon: string }[];
    content: ContentCardData[];
    tasks: ContentCardData[];
    navigation: {
      prev: { title: string };
      next: { title: string };
    };
  };
  rightSidebar: {
    xpSection: { title: string; earnedXp: number; totalXp: number; xpMessage: string };
    achievements: { title: string; items: Achievement[] };
    weaknessAnalysis: { title: string; score: number; scoreLabel: string; items: Weakness[] };
    aiTutor: { title: string; subtitle: string; inputPlaceholder: string; examples: string[] };
  };
}

export async function loadTutorialData(brand: BrandConfig): Promise<SubtopicViewData> {
  return {
    nav: {
      courseLabel: 'Full-Stack Development',
      lessonLabel: 'React Basics',
      dashboardCtaLabel: 'Dashboard',
      streak: 12,
      xpPoints: 12450,
      learnerInitials: 'AJ',
    },
    subtopic: {
      title: 'Component Architecture',
      description: 'Master the art of building scalable and reusable UI components using React best practices and design patterns.',
      progress: 65,
      progressLabel: 'Subtopic Progress',
      metadata: {
        level: 'Intermediate',
        readingTime: '45 mins',
        xp: 500,
        topicsCount: 5,
        lastUpdated: 'Today',
      },
      stats: [
        { id: 'time', label: 'Est. Time', value: '45 mins', icon: 'Clock' },
        { id: 'level', label: 'Difficulty', value: 'Intermediate', icon: 'BarChart' },
        { id: 'xp', label: 'Reward', value: '500 XP', icon: 'Zap' },
      ],
      overallProgress: {
        percentage: 65,
        checklist: [
          { label: 'Introduction to Components', completed: true },
          { label: 'Functional vs Class Components', completed: true },
          { label: 'State Management Basics', completed: false },
          { label: 'Component Lifecycle', completed: false },
        ],
      },
      sidebar: {
        subtopicsTitle: 'React Fundamentals',
        items: [
          { id: 'st1', title: 'What is JSX?', status: 'completed' },
          { id: 'st2', title: 'Components & Props', status: 'completed' },
          { id: 'st3', title: 'Component Architecture', status: 'active', isCurrent: true },
          { id: 'st4', title: 'State & Lifecycle', status: 'locked' },
          { id: 'st5', title: 'Hooks Introduction', status: 'locked' },
        ],
      },
      tabs: [
        { id: 'learn', label: 'Learn', icon: 'BookOpen' },
        { id: 'practice', label: 'Practice', icon: 'Rocket' },
        { id: 'assignment', label: 'Assignment', icon: 'ClipboardList' },
        { id: 'project', label: 'Project', icon: 'Puzzle' },
        { id: 'quiz', label: 'Quiz', icon: 'ClipboardCheck' },
        { id: 'ai-tutor', label: brand.tutorLabel, icon: 'Bot' },
        { id: 'summary', label: 'Summary', icon: 'FileText' },
        { id: 'interview', label: 'Interview', icon: 'Presentation' },
        { id: 'remediation', label: 'Remediation', icon: 'Activity' },
      ],
      content: [
        {
          id: 'c1', title: 'Notes', type: 'notes',
          content: 'Learn how to break down complex UIs into smaller, independent, and reusable pieces for better scalability.',
          ctaLabel: 'Read Full Notes'
        },
        {
          id: 'c2', title: 'Layman Explanation', type: 'layman',
          content: 'Think of Component Architecture like building with LEGO bricks. Mix and match pieces to build anything!',
          ctaLabel: 'Read More'
        },
        {
          id: 'c3', title: 'Real-Life Example', type: 'example',
          content: 'From navbars to profile cards, reusable components are the building blocks of every modern web application.',
          ctaLabel: 'Read Examples'
        },
        {
          id: 'c4', title: 'Code Example', type: 'code',
          code: '// Simple UI Component\nconst Card = ({ title }) => (\n  <div className="card">\n    <h2>{title}</h2>\n  </div>\n);',
          ctaLabel: 'Run Code'
        },
        {
          id: 'c5', title: 'Technical Deep Dive', type: 'deep-dive',
          content: 'Master advanced patterns like Container/Presentational, Atomic Design, and Prop Composition.',
          ctaLabel: 'Read Details'
        },
        {
          id: 'c6', title: 'Visual Explanation', type: 'visual',
          content: 'Flowchart: Logic vs UI',
          ctaLabel: 'Watch Video'
        }
      ],
      tasks: [
        {
          id: 't1', title: 'Practice Tasks', type: 'practice',
          content: '- Identify container vs presentational components\n- Break a complex UI into a component tree\n- Implement the children prop',
          ctaLabel: 'View All (10)'
        },
        {
          id: 't2', title: 'Assignment', type: 'assignment',
          content: 'Refactor a monolithic React component into 3 smaller, reusable functional components using props.',
          badge: { text: 'Easy', type: 'success' },
          ctaLabel: 'Start Assignment'
        },
        {
          id: 't3', title: 'Project', type: 'project',
          content: 'Build a modular E-commerce Dashboard using Atomic Design principles and strict component separation.',
          badge: { text: 'Intermediate', type: 'success' },
          ctaLabel: 'View Project'
        },
        {
          id: 't4', title: 'Quiz', type: 'quiz',
          content: '10 Questions\nPassing Score: 70%\nBest Score: 8/10',
          ctaLabel: 'Start Quiz'
        }
      ],
      navigation: {
        prev: { title: 'Components & Props' },
        next: { title: 'State & Lifecycle' },
      },
    },
    rightSidebar: {
      xpSection: {
        title: 'XP & Badges',
        earnedXp: 80,
        totalXp: 120,
        xpMessage: 'for completing this subtopic'
      },
      achievements: {
        title: 'Achievements',
        items: [
          { id: 'a1', title: 'Architecture Novice', description: 'Build your first reusable component', icon: 'Award', color: 'blue' },
          { id: 'a2', title: 'State Lifter', description: 'Successfully lift state to a parent component', icon: 'Award', color: 'red' },
          { id: 'a3', title: 'Atomic Thinker', description: 'Apply atomic design to a feature', icon: 'Award', color: 'blue' },
        ]
      },
      weaknessAnalysis: {
        title: 'Weakness Analysis',
        score: 68,
        scoreLabel: 'Needs Improvement',
        items: [
          { id: 'w1', topic: 'Prop Drilling', status: 'Weak', color: 'rose' },
          { id: 'w2', topic: 'State Colocation', status: 'Weak', color: 'rose' },
          { id: 'w3', topic: 'Component Reusability', status: 'Medium', color: 'amber' },
        ]
      },
      aiTutor: {
        title: `Ask ${brand.tutorLabel}`,
        subtitle: `Got doubts about this topic?\nAsk our ${brand.tutorLabel} anytime.`,
        inputPlaceholder: 'Ask anything...',
        examples: ['Examples', 'Explain like I\'m 5', 'Interview Q']
      }
    }
  };
}
