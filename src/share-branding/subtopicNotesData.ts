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
      simpleOverview?: {
        badge: string;
        headline: string;
        simpleDefinition: string;
        subExplanation: string;
        importanceBlock: string;
        progressIndicator?: string;
      };
      everydayAnalogy?: {
        title: string;
        storyAnalogy: string;
        comparisonPanel: {
          realWorld: string;
          technical: string;
        };
        visualMetaphor: string;
        keyTakeaway: string;
        image?: string;
      };
      whyItExists?: {
        sectionTitle: string;
        benefitCards: Array<{
          id: string;
          title: string;
          description: string;
          icon: string;
          type: 'career' | 'practical' | 'future';
        }>;
      };
      simpleUseCases?: {
        gridTitle: string;
        useCaseCards: Array<{
          id: string;
          title: string;
          description: string;
          category: 'everyday' | 'career';
          icon: string;
        }>;
      };
      beginnerBreakdown?: {
        title: string;
        steps: Array<{
          id: string;
          stepTitle: string;
          stepExplanation: string;
          microLearningChunk: string;
        }>;
      };
      mentalModel?: {
        title: string;
        conceptMap: {
          nodes: Array<{
            id: string;
            label: string;
            description: string;
          }>;
          connections: Array<{
            from: string;
            to: string;
            label: string;
          }>;
        };
        visualLabels: string[];
      };
      commonConfusions?: {
        title: string;
        confusionItems: Array<{
          id: string;
          confusion: string;
          clarification: string;
        }>;
        faqItems: Array<{
          id: string;
          question: string;
          answer: string;
        }>;
        misconceptionAlerts: string[];
      };
      simpleRecap?: {
        summaryTitle: string;
        keyTakeaways: string[];
        simpleRecapPoints: string[];
        confidenceBoost: string;
        memoryReinforcement: string;
      };
    };
    realLifeExamples?: {
      // 1. Concept to Real World Mapping
      conceptMapping?: {
        badge: string;
        headline: string;
        conceptDefinition: string;
        realWorldTranslation: string;
        importanceBlock: string;
        careerRelevance?: string;
      };
      // 2. Industry Use Case
      industryUseCase?: {
        title: string;
        industryName: string;
        scenarioDescription: string;
        businessContext: string;
        implementation: string;
        impact: string;
        keyTakeaway: string;
        image?: string;
      };
      // 3. Daily Life Example
      dailyLifeExample?: {
        title: string;
        storyTitle: string;
        storyNarrative: string;
        everydayConnection: string;
        technicalMapping: string;
        relatableInsight: string;
        image?: string;
      };
      // 4. Career Relevance
      careerRelevance?: {
        title: string;
        careerPaths: {
          id: string;
          role: string;
          description: string;
          skillLevel: 'entry' | 'mid' | 'senior';
          salaryRange?: string;
          icon: string;
        }[];
        industryDemand: string;
        futureGrowth: string;
      };
      // 5. Problem Solution Context
      problemSolutionContext?: {
        title: string;
        problemStatement: string;
        context: string;
        solution: string;
        implementation: string;
        outcome: string;
        lessonsLearned: string;
      };
      // 6. Business Application
      businessApplication?: {
        title: string;
        companyType: string;
        businessChallenge: string;
        technicalApplication: string;
        businessProcess: string;
        roi: string;
        scalability: string;
        keyInsight: string;
      };
      // 7. Domain Specific Scenarios
      domainScenarios?: {
        title: string;
        scenarios: {
          id: string;
          domain: string;
          title: string;
          description: string;
          application: string;
          icon: string;
        }[];
      };
      // 8. Practical Recap
      practicalRecap?: {
        summaryTitle: string;
        keyApplications: string[];
        industryRelevance: string[];
        careerImpact: string;
        nextSteps: string[];
        practicalAdvice: string;
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
  visualExplanation?: {
    // 1. Core Concept Visualization
    conceptVisualIntro?: {
      badge: string;
      headline: string;
      visualDefinition: string;
      heroDiagramPreview?: string;
      importanceBlock: string;
      progressIndicator?: string;
    };
    // 2. Diagrammatic Breakdown
    diagrammaticBreakdown?: {
      title: string;
      diagramTitle: string;
      componentLabels: Array<{
        id: string;
        label: string;
        description: string;
      }>;
      stepMarkers: string[];
      technicalTooltips: Array<{
        id: string;
        term: string;
        explanation: string;
      }>;
    };
    // 3. Step-by-Step Visual Flow
    stepByStepVisualFlow?: {
      title: string;
      sequenceTitle: string;
      steps: Array<{
        id: string;
        stepNumber: number;
        title: string;
        description: string;
        visualCue: string;
      }>;
      phaseExplanations: string[];
    };
    // 4. Comparative Visualization
    comparativeVisualization?: {
      title: string;
      comparisonTitle: string;
      sideBySideVisuals: {
        option1: {
          title: string;
          description: string;
          pros: string[];
          cons: string[];
        };
        option2: {
          title: string;
          description: string;
          pros: string[];
          cons: string[];
        };
      };
      differenceHighlights: string[];
    };
    // 5. Mental Model Visualization
    mentalModelVisualization?: {
      title: string;
      frameworkMap: {
        nodes: Array<{
          id: string;
          label: string;
          description: string;
          type: 'core' | 'supporting' | 'related';
        }>;
        connections: Array<{
          from: string;
          to: string;
          label: string;
          type: 'primary' | 'secondary';
        }>;
      };
      memoryLabels: string[];
    };
    // 6. Real-World Visual Mapping
    realWorldVisualMapping?: {
      title: string;
      practicalScenarios: Array<{
        id: string;
        title: string;
        description: string;
        industryContext: string;
        visualRepresentation: string;
        icon: string;
      }>;
      careerRelevance: string;
    };
    // 7. Common Confusion Visualization
    commonConfusionVisualization?: {
      title: string;
      confusionItems: Array<{
        id: string;
        confusion: string;
        visualClarification: string;
        correctVisualization: string;
      }>;
      faqItems: Array<{
        id: string;
        question: string;
        answer: string;
      }>;
      misconceptionDiagrams: string[];
    };
    // 8. Visual Summary
    visualSummary?: {
      summaryTitle: string;
      keyVisualTakeaways: string[];
      revisionInfographic: string;
      memoryReinforcement: string;
      examVisualChecklist: string[];
    };
  };
  practiceTest?: {
    // 1. Assessment Intro
    assessmentIntro?: {
      badge: string;
      headline: string;
      testDescription: string;
      difficultyOverview: string;
      learningGoals: string[];
      readinessIndicator: string;
    };
    // 2. Concept Recall Questions (MCQ)
    conceptRecallQuestions?: {
      title: string;
      questions: Array<{
        id: string;
        questionNumber: number;
        type: 'single-choice' | 'multiple-choice';
        points: number;
        question: string;
        code?: string;
        options: Array<{
          id: string;
          text: string;
        }>;
        correctAnswer: string | string[];
        explanation: string;
        difficulty: 'easy' | 'medium' | 'hard';
      }>;
    };
    // 3. Scenario-Based Questions
    scenarioBasedQuestions?: {
      title: string;
      scenarios: Array<{
        id: string;
        scenarioTitle: string;
        realWorldProblem: string;
        businessContext: string;
        decisionQuestion: string;
        options: Array<{
          id: string;
          text: string;
        }>;
        correctAnswer: string;
        explanation: string;
        difficulty: 'medium' | 'hard';
      }>;
    };
    // 4. Difficulty Progression
    difficultyProgression?: {
      title: string;
      levels: Array<{
        id: string;
        level: 'beginner' | 'intermediate' | 'advanced';
        description: string;
        questionCount: number;
        passingScore: number;
      }>;
      adaptiveLogic: boolean;
    };
    // 5. Instant Feedback
    instantFeedback?: {
      enabled: boolean;
      feedbackType: 'immediate' | 'end-of-test';
    };
    // 6. Common Mistake Detection
    commonMistakeDetection?: {
      title: string;
      mistakeCategories: Array<{
        id: string;
        category: string;
        description: string;
        frequency: number;
      }>;
      weaknessHeatmap: {
        topics: Array<{
          id: string;
          topic: string;
          score: number;
          status: 'strong' | 'moderate' | 'weak';
        }>;
      };
    };
    // 7. Performance Analytics
    performanceAnalytics?: {
      title: string;
      scoreDisplay: {
        currentScore: number;
        maxScore: number;
        percentage: number;
      };
      performanceGraphs: {
        accuracyTrend: number[];
        speedTrend: number[];
      };
      benchmarkComparison: {
        userScore: number;
        averageScore: number;
        topScore: number;
      };
      masteryPercentage: number;
      examReadinessScore: number;
    };
    // 8. Revision Recommendations
    revisionRecommendations?: {
      title: string;
      personalizedLearningPath: Array<{
        id: string;
        topic: string;
        priority: 'high' | 'medium' | 'low';
        estimatedTime: string;
        resources: string[];
      }>;
      weaknessRecoverySteps: string[];
      recommendedResources: Array<{
        id: string;
        title: string;
        type: 'video' | 'article' | 'practice';
        link: string;
      }>;
      futureGoals: string[];
    };
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
