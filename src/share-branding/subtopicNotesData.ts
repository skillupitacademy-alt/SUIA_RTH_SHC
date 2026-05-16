import { BrandConfig } from './brandConfig';
import { getSubtopicContent, SubtopicContentPattern } from './subtopicContentRegistry';

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
  sectionErrors?: Partial<Record<
    | 'notes'
    | 'layman'
    | 'real_life'
    | 'technical'
    | 'code'
    | 'visual'
    | 'practice'
    | 'assignment'
    | 'project'
    | 'quiz'
    | 'summary'
    | 'interview'
    | 'ai_tutor',
    string
  >>;
  sectionRecordIds?: Partial<Record<
    | 'overview'
    | 'notes'
    | 'layman'
    | 'real_life'
    | 'technical'
    | 'code'
    | 'visual'
    | 'practice'
    | 'assignment'
    | 'project'
    | 'quiz'
    | 'summary'
    | 'interview'
    | 'ai_tutor',
    string
  >>;
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
  } & SubtopicContentPattern & {
    // Legacy Notes-only visual blocks (preserved for compatibility)
    summaryHeroInfographic?: {
      image?: any;
      summaryTitle?: string;
      examTips?: string[];
      howItWorks?: Array<{ step: number; label: string; description: string }>;
    };
    conceptMemoryMap?: {
      image?: any;
      nodes?: Array<{ id: string; label: string; description: string }>;
      connections?: Array<{ from: string; to: string; label?: string }>;
    };
    cheatSheetSVG?: {
      title?: string;
      image?: any;
      svgPath?: string;
      sections?: any[];
    };
    flashcardVisualSystem?: {
      cards: Array<{ id: string; question: string; answer: string }>;
    };
    comparisonSummaryChart?: {
      title?: string;
      columns: string[];
      rows: string[][];
    };
    mnemonicRetentionGraphic?: {
      mnemonicTitle?: string;
      memoryHook?: string;
      rememberItems: Array<{ letter: string; label: string; description: string }>;
      keyPoints: string[];
    };
    syntaxBlock?: {
      code: string;
      language?: string;
      title?: string;
      subtitle?: string;
      explanations: Array<{ id: string; term: string; explanation: string }>;
    };
    summary?: {
      title?: string;
      description?: string;
      masteryRecapCard?: Record<string, any>;
      nextStepPanel?: Record<string, any>;
      keyTakeawayGrid?: any[];
      revisionChecklist?: any[];
      [key: string]: any;
    };
    interview?: {
      title?: string;
      description?: string;
      [key: string]: any;
    };
    aiTutorContent?: {
      greeting?: string;
      qaPairs?: Array<{ question: string; answer: string }>;
      [key: string]: any;
    };
    footerBlock?: {
      image?: any;
      finalNote?: string;
      nextStepLabel?: string;
      nextStepTarget?: string;
      quote?: string;
    };
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
      courseLabel: 'Course',
      lessonLabel: 'Lesson',
      dashboardCtaLabel: 'Dashboard',
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
        { id: 'visual-explanation', label: 'Visual Explanation', status: 'pending', icon: 'Eye' },
        { id: 'practice-test', label: 'Practice Test', status: 'pending', icon: 'Pencil' },
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
      ...(content.laymanExplanation && { laymanExplanation: content.laymanExplanation }),
      ...(content.realLifeExamples && { realLifeExamples: content.realLifeExamples }),
      ...(content.technicalDeepDive && { technicalDeepDive: content.technicalDeepDive }),
      ...(content.codeExample && { codeExample: content.codeExample }),
      ...(content.visualExplanation && { visualExplanation: content.visualExplanation }),
      ...(content.practiceTest && { practiceTest: content.practiceTest }),
      ...(content.assignment && { assignment: content.assignment }),
      ...(content.project && { project: content.project }),
      ...(content.quiz && { quiz: content.quiz }),
      ...(content.progress && { progress: content.progress })
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
