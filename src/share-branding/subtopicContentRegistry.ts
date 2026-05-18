/**
 * Universal Subtopic Content Registry
 * 
 * This file defines the universal pattern for all subtopic content.
 * Component-architecture is the BASE pattern that all other subtopics follow.
 * 
 * Pattern Structure:
 * - simpleWords: Brief explanation
 * - sections: Array of content sections with title, content, keyPoint, codeExample
 * - laymanExplanation: Simple analogy with mainConcept, reasonGrid, typesTable
 * - realLifeExamples: Real-world scenarios with hero, scenarios, walkthrough
 * - technicalDeepDive: In-depth technical content with sections
 */

export interface SubtopicContentPattern {
  simpleWords: string;
  // Notes Section Templates (8 templates from JSON spec)
  definitionBlock: {
    badge: string;
    headline: string;
    definitionText: string;
    importanceCallout: string;
    quickSummary: string[];
  };
  sections: Array<{
    id: string;
    title: string;
    content: string;
    keyPoint?: string;
    codeExample?: {
      code: string;
      output: string;
    };
  }>;
  componentGrid: {
    gridTitle: string;
    componentCards: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      subcomponents: string[];
    }>;
  };
  examplePanel: {
    exampleTitle: string;
    scenarios: Array<{
      id: string;
      title: string;
      scenarioDescription: string;
      practicalSolution: string;
      industryContext: string;
    }>;
  };
  practiceCard: {
    bestPracticeTitle: string;
    recommendations: Array<{
      id: string;
      title: string;
      description: string;
    }>;
    optimizationTips: string[];
    industryStandards: string[];
  };
  warningFaq: {
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
  summaryCard: {
    summaryTitle: string;
    keyTakeaways: string[];
    revisionChecklist: Array<{
      id: string;
      item: string;
      checked: boolean;
    }>;
    memoryReinforcement: string;
    examTips: string[];
    image?: any;
  };
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
  footerBlock?: {
    image?: any;
    finalNote?: string;
    nextStepLabel?: string;
    nextStepTarget?: string;
    quote?: string;
  };
  syntaxBlock?: {
    image?: any;
    code: string;
    language?: string;
    title?: string;
    subtitle?: string;
    explanations: Array<{ id: string; term: string; explanation: string }>;
  };
  flashcardVisualSystem?: {
    image?: any;
    cards: Array<{ id: string; question: string; answer: string }>;
  };
  comparisonSummaryChart?: {
    image?: any;
    title?: string;
    columns: string[];
    rows: string[][];
  };
  mnemonicRetentionGraphic?: {
    image?: any;
    mnemonicTitle?: string;
    memoryHook?: string;
    rememberItems: Array<{ letter: string; label: string; description: string }>;
    keyPoints: string[];
  };
  // Layman Explanation Section Templates (8 templates from JSON spec)
  laymanExplanation?: {
    simpleOverview?: {
      badge: string;
      headline: string;
      simpleDefinition: string;
      subExplanation: string;
      importanceBlock: string;
      heroVisual?: {
        type: 'inline_svg';
        dataUri: string;
        width?: number;
        height?: number;
        alt?: string;
      };
    };
    everydayAnalogy?: {
      title: string;
      storyAnalogy: string;
      comparisonPanel: string;
      visualMetaphor: Array<{ label: string; comparison: string }>;
      keyTakeaway: string;
      analogyVisual?: {
        type: 'inline_svg';
        dataUri: string;
        width?: number;
        height?: number;
        alt?: string;
      };
    };
    whyItExists?: {
      sectionTitle: string;
      benefitCards: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        type?: string;
      }>;
    };
    simpleUseCases?: {
      gridTitle: string;
      useCaseCards: Array<{
        id: string;
        title: string;
        description: string;
        category?: string;
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
        progressiveLearning?: string;
      }>;
    };
    mentalModel?: {
      title: string;
      conceptMap: Array<{ id: string; label: string; type?: string }>;
      visualLabels: Array<{ from: string; to: string; label: string }>;
      flowArrows?: Array<{ id: string; label: string; icon: string }>;
      tooltips?: string;
    };
    commonConfusions?: {
      title: string;
      confusionItems: Array<{ id: string; confusion: string; clarification: string }>;
      faqItems?: Array<{ id: string; question: string; answer: string }>;
      misconceptionAlerts: string[];
    };
    simpleRecap?: {
      summaryTitle: string;
      keyTakeaways: string[];
      simpleRecapPoints: Array<{
        id: string;
        item: string;
        checked: boolean;
      }>;
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
      careerPaths: Array<{
        id: string;
        role: string;
        description: string;
        skillLevel: 'entry' | 'mid' | 'senior';
        salaryRange?: string;
        icon: string;
      }>;
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
      scenarios: Array<{
        id: string;
        domain: string;
        title: string;
        description: string;
        application: string;
        icon: string;
      }>;
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
    sections: Array<{
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
    }>;
  };
  codeExample?: {
    problemContext?: {
      title: string;
      scenario: string;
      requirements: string[];
      constraints: string;
    };
    basicCodeExample?: {
      title: string;
      description: string;
      code: string;
      language: string;
      explanation: string;
    };
    lineByLineExplanation?: {
      title: string;
      lines: Array<{
        id: string;
        lineNumber: number;
        code: string;
        explanation: string;
      }>;
    };
    outputDemonstration?: {
      title: string;
      input: string;
      output: string;
      explanation: string;
      visualRepresentation: string;
    };
    bestPracticeVersion?: {
      title: string;
      improvements: string[];
      code: string;
      explanation: string;
      benefits: string[];
    };
    commonMistakes?: {
      title: string;
      mistakes: Array<{
        id: string;
        mistake: string;
        badCode: string;
        why: string;
        goodCode: string;
        lesson: string;
      }>;
    };
    realWorldImplementation?: {
      title: string;
      scenario: string;
      code: string;
      features: string[];
      explanation: string;
      scalability: string;
    };
    codeSummary?: {
      title: string;
      keyTakeaways: string[];
      practiceExercise: string;
      nextSteps: string[];
    };
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
    conceptVisualIntro?: {
      badge: string;
      headline: string;
      visualDefinition: string;
      heroDiagramPreview?: string;
      importanceBlock: string;
      progressIndicator?: string;
    };
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
    visualSummary?: {
      summaryTitle: string;
      keyVisualTakeaways: string[];
      revisionInfographic: string;
      memoryReinforcement: string;
      examVisualChecklist: string[];
    };
  };
  practiceTest?: {
    assessmentIntro?: {
      badge: string;
      headline: string;
      testDescription: string;
      difficultyOverview: string;
      learningGoals: string[];
      readinessIndicator: string;
    };
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
    instantFeedback?: {
      enabled: boolean;
      feedbackType: 'immediate' | 'end-of-test';
    };
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
}

/**
 * Content Registry
 * Component-architecture is the BASE - all other subtopics follow this pattern
 */
import { componentArchitectureContent } from './subtopics/component-architecture';
import { whatIsJavaScriptContent } from './subtopics/whatisjavascript';
import { variableContent } from './subtopics/variable';

export const subtopicContentRegistry: Record<string, SubtopicContentPattern> = {
  'component-architecture': componentArchitectureContent,
  'whatisjavascript': whatIsJavaScriptContent,
  'variable': variableContent
};

/**
 * Get content for a subtopic
 * Returns undefined if subtopic not found - no fallback
 */
export function getSubtopicContent(subtopicId: string): SubtopicContentPattern | undefined {
  return subtopicContentRegistry[subtopicId];
}
