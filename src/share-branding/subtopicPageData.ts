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
        { id: 'practice', label: 'Practice', icon: 'Code2' },
        { id: 'quiz', label: 'Quiz', icon: 'HelpCircle' },
        { id: 'resources', label: 'Resources', icon: 'Link' },
      ],
      content: [
        {
          id: 'c1', title: 'Notes', type: 'notes',
          content: 'A variable is a container that stores data values. In JavaScript, we can declare variables using var, let, or const.\n\n• var → Old way, function-scoped\n• let → Block-scoped, can be updated\n• const → Block-scoped, cannot be reassigned',
          ctaLabel: 'Read Full Notes'
        },
        {
          id: 'c2', title: 'Layman Explanation', type: 'layman',
          content: 'Think of variables like boxes that hold values. You can change what\'s inside the box (let), or keep it constant (const).\n\nImagine a box labeled "name" that can hold a value like "Suresh". You can change it to "Rohan" if the box is declared with let.',
          ctaLabel: 'Read More'
        },
        {
          id: 'c3', title: 'Real-Life Example', type: 'example',
          content: 'Variables are used everywhere!\n\n✓ Shopping cart total\n✓ User profile data\n✓ Game scores\n✓ Temperature in weather apps',
          ctaLabel: 'Read Examples'
        },
        {
          id: 'c4', title: 'Code Example', type: 'code',
          code: '// Variable declarations\nvar name = "Suresh";\nlet age = 25;\nconst isStudent = true;\n\n// Data types\nlet number = 42;             // Number\nlet text = "Hello";          // String\nlet flag = false;            // Boolean\nlet nothing = null;          // Null\nlet data;                    // Undefined\nlet person = { name: "Suresh" }; // Object\nlet fruits = ["Apple", "Banana"]; // Array',
          ctaLabel: 'Run Code'
        },
        {
          id: 'c5', title: 'Technical Deep Dive', type: 'deep-dive',
          content: '• JavaScript is loosely typed.\n• Types are dynamic.\n• Primitive types are stored in stack.\n• Reference types are stored in heap.\n• Use typeof to check type.\n• Type coercion happens in comparisons.',
          ctaLabel: 'Read Full Details'
        },
        {
          id: 'c6', title: 'Visual Explanation', type: 'visual',
          content: 'Stack (Primitive) vs Heap (Reference)',
          ctaLabel: 'Watch Video (4:35)'
        }
      ],
      tasks: [
        {
          id: 't1', title: 'Practice Tasks', type: 'practice',
          content: '• Declare variables of all data types\n• Swap two variables\n• Check data types using typeof',
          ctaLabel: 'View All (10)'
        },
        {
          id: 't2', title: 'Assignment', type: 'assignment',
          content: 'Create a program that stores user information (name, age, email, isStudent) and display them.',
          badge: { text: 'Easy', type: 'success' },
          ctaLabel: 'Start Assignment'
        },
        {
          id: 't3', title: 'Project', type: 'project',
          content: 'Build a Personal Information Manager that stores and displays user details.',
          badge: { text: 'Beginner', type: 'success' },
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
        title: 'Session Progress',
        earnedXp: 325,
        totalXp: 500,
        xpMessage: 'You are doing great! 175 more XP to reach today\'s goal.'
      },
      achievements: {
        title: 'Recent Milestones',
        items: [
          { id: 'a1', title: 'Component Master', description: 'Built 5 reusable components', icon: 'Award', color: 'amber' },
          { id: 'a2', title: 'Clean Coder', description: 'Passed 10 linting checks', icon: 'Shield', color: 'emerald' },
        ]
      },
      weaknessAnalysis: {
        title: 'Weakness Analysis',
        score: 72,
        scoreLabel: 'Overall Proficiency',
        items: [
          { id: 'w1', topic: 'State Management', status: 'Improving', color: 'blue' },
          { id: 'w2', topic: 'Lifecycle Hooks', status: 'Needs Work', color: 'rose' },
        ]
      },
      aiTutor: {
        title: `${brand.tutorLabel}`,
        subtitle: 'I can help you understand component architecture better.',
        inputPlaceholder: 'Ask me anything...',
        examples: ['What is Props?', 'Explain State', 'Code Review']
      }
    }
  };
}
