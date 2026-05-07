import { BrandConfig } from './brandConfig';
import { getSubtopicContent } from './subtopicContentRegistry';

export interface LearningPathItem {
  id: string;
  label: string;
  status: 'active' | 'completed' | 'pending' | 'locked';
  icon: string;
}

export interface RelatedSubtopic {
  id: string;
  title: string;
  status: 'next' | 'default';
}

export interface SubtopicNotesViewData {
  nav: {
    courseLabel: string;
    lessonLabel: string;
    dashboardCtaLabel: string;
    streak: number;
    xpPoints: number;
    learnerInitials: string;
  };
  leftSidebar: {
    title: string;
    items: LearningPathItem[];
    progress: {
      percentage: number;
      message: string;
    };
  };
  mainContent: {
    breadcrumbs: string[];
    title: string;
    meta: {
      readTime: string;
      level: string;
      xp: number;
    };
    simpleWords: string;
    definitionBlock?: {
      badge: string;
      headline: string;
      definitionText: string;
      importanceCallout: string;
      quickSummary: string[];
    };
    sections: {
      id: string;
      title: string;
      content: string;
      keyPoint?: string;
      codeExample?: {
        code: string;
        output: string;
      };
    }[];
    componentGrid?: {
      gridTitle: string;
      componentCards: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        subcomponents: string[];
      }>;
    };
    examplePanel?: {
      exampleTitle: string;
      scenarios: Array<{
        id: string;
        title: string;
        scenarioDescription: string;
        practicalSolution: string;
        industryContext: string;
      }>;
    };
    practiceCard?: {
      bestPracticeTitle: string;
      recommendations: Array<{
        id: string;
        title: string;
        description: string;
      }>;
      optimizationTips: string[];
      industryStandards: string[];
    };
    warningFaq?: {
      commonErrors: Array<{
        id: string;
        error: string;
        solution: string;
      }>;
      faqItems: Array<{
        id: string;
        question: string;
        answer: string;
      }>;
      misconceptionAlerts: string[];
    };
    summaryCard?: {
      summaryTitle: string;
      keyTakeaways: string[];
      revisionChecklist: Array<{
        id: string;
        item: string;
        checked: boolean;
      }>;
      memoryReinforcement: string;
      examTips: string[];
    };
    laymanExplanation?: {
      badge: string;
      title: string;
      intro: string;
      mainConcept: {
        title: string;
        description: string;
        example: string;
        image: string;
      };
      reasonGrid: {
        id: string;
        title: string;
        description: string;
        icon: string;
      }[];
      typesTable: {
        id: string;
        label: string;
        description: string;
        example: string;
        icon: string;
        iconBg: string;
      }[];
      footerTip: string;
    };
    realLifeExamples?: {
      title: string;
      intro: string;
      hero: {
        badge: string;
        title: string;
        description: string;
        highlight: string;
        image: string;
      };
      scenarios: {
        id: string;
        title: string;
        description: string;
        footer: string;
        image: string;
      }[];
      walkthrough: {
        title: string;
        subtitle: string;
        steps: {
          id: string;
          title: string;
          description: string;
          icon: string;
        }[];
        footer: string;
      };
    };
    technicalDeepDive?: {
      title: string;
      badge: string;
      intro: string;
      sections: {
        id: string;
        title: string;
        content: string;
        diagram?: {
          type: 'anatomy' | 'flow' | 'chain';
          data: any;
        };
        code?: {
          language: string;
          code: string;
          output?: string;
        };
        keyPoints?: string[];
        steps?: { id: string; text: string }[];
        highlight?: string;
      }[];
    };
  };
  codeExample?: {
    title: string;
    description: string;
    examples: Array<{
      title: string;
      file: string;
    }>;
    code: string;
    output: string;
    tip: string;
  };
  assignment?: {
    title: string;
    description: string;
    xp: number;
    duration: string;
    task: {
      title: string;
      description: string;
      requirements: string[];
    };
    objectives: string[];
    starterCode: string;
    submissionGuidelines: string[];
  };
  project?: {
    title: string;
    description: string;
    xp: number;
    deadline: string;
    hero: {
      badge: string;
      title: string;
      description: string;
      image: string;
    };
    realWorldUse: string;
    skills: string[];
    buildItems: string[];
    deliverables: string[];
  };
  quiz?: {
    title: string;
    description: string;
    totalQuestions: number;
    duration: string;
    xp: number;
    questions: Array<{
      id: string;
      questionNumber: number;
      type: string;
      points: number;
      question: string;
      code?: string;
      options: Array<{
        id: string;
        text: string;
      }>;
      correctAnswer: string;
      explanation: string;
    }>;
  };
  progress?: {
    title: string;
    description: string;
    stats: {
      completionPercentage: number;
      xpEarned: number;
      totalXp: number;
      streak: number;
      timeSpent: string;
    };
    milestones: Array<{
      id: string;
      title: string;
      status: 'completed' | 'current' | 'locked';
      xp: number;
    }>;
  };
  rightSidebar: {
    aiTutor: {
      title: string;
      messages: { text: string; time: string; sender: 'user' | 'bot' }[];
      inputPlaceholder: string;
    };
    courseProgress: {
      percentage: number;
      courseName: string;
      label: string;
    };
    xpStats: {
      earned: number;
      total: number;
    };
    relatedSubtopics: RelatedSubtopic[];
    laymanSidebar?: {
      quickSummary: string[];
      keyTerms: { term: string; definition: string }[];
      readingTime: string;
      thinkAboutIt: string;
    };
    deepDiveSidebar?: {
      onThisPage: { id: string; label: string }[];
      quickLinks: { id: string; label: string; icon: string }[];
    };
  };
}

export async function loadSubtopicNotesData(brand: BrandConfig, subtopicId: string = 'component-architecture'): Promise<SubtopicNotesViewData> {
  // Safety check for undefined subtopicId
  if (!subtopicId) {
    subtopicId = 'component-architecture';
  }

  // Map of subtopic metadata
  const subtopicMap: Record<string, { title: string; description: string; level: string; topic: string }> = {
    'component-architecture': {
      title: 'Component Architecture in React',
      description: 'Master the art of building scalable and reusable UI components using React best practices and design patterns.',
      level: 'Intermediate',
      topic: 'React Basics'
    },
    'javascript-promises': {
      title: 'JavaScript Promises',
      description: 'Learn how to handle asynchronous operations with promises, async/await, and error handling patterns.',
      level: 'Beginner',
      topic: 'JavaScript Fundamentals'
    }
  };

  const subtopicInfo = subtopicMap[subtopicId] || subtopicMap['component-architecture'];

  // Get dynamic content from registry based on subtopicId
  const content = getSubtopicContent(subtopicId);
  
  // If content not found, throw error - no fallback
  if (!content) {
    throw new Error(`Content not found for subtopic: ${subtopicId}. Please add it to subtopicContentRegistry.ts`);
  }

  return {
    nav: {
      courseLabel: brand.courseLabel || 'Course',
      lessonLabel: brand.lessonLabel || 'Lesson',
      dashboardCtaLabel: brand.dashboardCtaLabel || 'Dashboard',
      streak: 7,
      xpPoints: 2450,
      learnerInitials: 'JD'
    },
    leftSidebar: {
      title: 'Learning Path',
      items: [
        { id: 'overview', label: 'Overview', status: 'completed', icon: 'LayoutDashboard' },
        { id: 'notes', label: 'Full Notes', status: 'active', icon: 'FileText' },
        { id: 'layman', label: 'Layman Explanation', status: 'pending', icon: 'Lightbulb' },
        { id: 'real-life', label: 'Real Life Examples', status: 'pending', icon: 'Globe' },
        { id: 'technical-deep-dive', label: 'Technical Deep Dive', status: 'pending', icon: 'Palette' },
        { id: 'code-example', label: 'Code Example', status: 'pending', icon: 'Monitor' },
        { id: 'assignments', label: 'Assignments', status: 'pending', icon: 'ClipboardList' },
        { id: 'project', label: 'Projects', status: 'pending', icon: 'Rocket' },
        { id: 'quiz', label: 'Quiz', status: 'pending', icon: 'HelpCircle' },
        { id: 'ai-tutor', label: brand.tutorLabel || 'AI Tutor', status: 'pending', icon: 'Bot' },
        { id: 'progress', label: 'Progress', status: 'pending', icon: 'TrendingUp' }
      ],
      progress: {
        percentage: 65,
        message: '65% Complete'
      }
    },
    mainContent: {
      breadcrumbs: ['Home', subtopicInfo.topic, 'Components', subtopicInfo.title],
      title: subtopicInfo.title,
      meta: {
        readTime: '10 min read',
        level: subtopicInfo.level,
        xp: 50
      },
      simpleWords: content.simpleWords,
      definitionBlock: content.definitionBlock,
      sections: content.sections,
      componentGrid: content.componentGrid,
      examplePanel: content.examplePanel,
      practiceCard: content.practiceCard,
      warningFaq: content.warningFaq,
      summaryCard: content.summaryCard,
      laymanExplanation: content.laymanExplanation,
      realLifeExamples: content.realLifeExamples,
      technicalDeepDive: content.technicalDeepDive,
      codeExample: content.codeExample,
      assignment: content.assignment,
      project: content.project,
      quiz: content.quiz,
      progress: content.progress
    },
    rightSidebar: {
      aiTutor: {
        title: `${brand.tutorLabel || 'Tutor'} (Ask Anything)`,
        messages: [
          { text: `What is ${subtopicInfo.title.toLowerCase()}?`, time: '2:30 PM', sender: 'user' },
          { text: `${content.simpleWords.substring(0, 100)}... Would you like to see an example?`, time: '2:30 PM', sender: 'bot' }
        ],
        inputPlaceholder: 'Ask a follow-up...'
      },
      courseProgress: {
        percentage: 65,
        courseName: subtopicInfo.topic,
        label: '65% Completed'
      },
      xpStats: {
        earned: 50,
        total: 2450
      },
      relatedSubtopics: [
        { id: 'rs1', title: 'Props and State', status: 'next' },
        { id: 'rs2', title: 'Component Lifecycle', status: 'default' },
        { id: 'rs3', title: 'Hooks API', status: 'default' }
      ],
      laymanSidebar: {
        quickSummary: [
          'A component is like a Lego brick.',
          'It is a self-contained piece of UI.',
          'You can reuse it anywhere.',
          'It makes code cleaner and easier to fix.'
        ],
        keyTerms: [
          { term: 'Component', definition: 'A reusable building block' },
          { term: 'Props', definition: 'Data passed into a component' },
          { term: 'State', definition: 'Internal data of a component' },
          { term: 'Atom', definition: 'The smallest possible piece' },
          { term: 'Molecule', definition: 'A group of atoms working together' }
        ],
        readingTime: '5 - 7 minutes',
        thinkAboutIt: "If you could build your entire website using only 5 types of bricks, which ones would they be? That's the power of atomic design!"
      },
      deepDiveSidebar: {
        onThisPage: [
          { id: 'anatomy', label: 'Component Anatomy' },
          { id: 'reconciliation', label: 'Reconciliation' },
          { id: 'resolution', label: 'Component Resolution' },
          { id: 'chaining', label: 'Chaining Mechanics' }
        ],
        quickLinks: [
          { id: 'ql1', label: 'React Docs', icon: 'ExternalLink' },
          { id: 'ql2', label: 'Best Practices', icon: 'BookOpen' },
          { id: 'ql3', label: 'Code Examples', icon: 'Code2' }
        ]
      }
    }
  };
}
