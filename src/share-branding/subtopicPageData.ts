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
        { id: 'ai-tutor', label: 'AI Tutor', icon: 'Bot' },
        { id: 'summary', label: 'Summary', icon: 'FileText' },
        { id: 'interview', label: 'Interview', icon: 'Presentation' },
        { id: 'remediation', label: 'Remediation', icon: 'Activity' },
      ],
      content: [
        {
          id: 'c1', title: 'Notes', type: 'notes',
          content: 'Component Architecture involves breaking down a UI into smaller, independent, and reusable pieces. A well-architected React app often separates Container components (handling logic and state) from Presentational components (handling UI and styling).',
          ctaLabel: 'Read Full Notes'
        },
        {
          id: 'c2', title: 'Layman Explanation', type: 'layman',
          content: 'Think of Component Architecture like building with LEGO bricks. Instead of building an entire car as one giant piece, you build the wheels, doors, and chassis separately, and then assemble them together. This way, you can easily reuse the wheels on another vehicle!',
          ctaLabel: 'Read More'
        },
        {
          id: 'c3', title: 'Real-Life Example', type: 'example',
          content: 'Reusable components are used everywhere in web apps:\n\n✓ A primary Button used across the site\n✓ A Navbar shared on all pages\n✓ A User Profile card\n✓ A reusable Modal window',
          ctaLabel: 'Read Examples'
        },
        {
          id: 'c4', title: 'Code Example', type: 'code',
          code: '// Presentational Component (Dumb)\nconst UserCard = ({ user }) => (\n  <div className="card">\n    <h2>{user.name}</h2>\n    <p>{user.email}</p>\n  </div>\n);\n\n// Container Component (Smart)\nconst UserContainer = () => {\n  const [user, setUser] = useState(null);\n  \n  useEffect(() => {\n    fetchUser().then(data => setUser(data));\n  }, []);\n\n  if (!user) return <Loader />;\n  return <UserCard user={user} />;\n};',
          ctaLabel: 'Run Code'
        },
        {
          id: 'c5', title: 'Technical Deep Dive', type: 'deep-dive',
          content: '• Container/Presentational Pattern: separates logic from UI.\n• Atomic Design: Atoms (Button) → Molecules (SearchBar) → Organisms (Header) → Templates.\n• Lifting State Up: Sharing state between sibling components.\n• Composition: Using props.children to pass React nodes.',
          ctaLabel: 'Read Full Details'
        },
        {
          id: 'c6', title: 'Visual Explanation', type: 'visual',
          content: 'Container vs Presentational Flowchart',
          ctaLabel: 'Watch Video (4:35)'
        }
      ],
      tasks: [
        {
          id: 't1', title: 'Practice Tasks', type: 'practice',
          content: '• Identify container vs presentational components\n• Break a complex UI into a component tree\n• Implement the children prop',
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
        subtitle: 'Got doubts about this topic?\nAsk our AI Tutor anytime.',
        inputPlaceholder: 'Ask anything...',
        examples: ['Examples', 'Explain like I\'m 5', 'Interview Q']
      }
    }
  };
}
