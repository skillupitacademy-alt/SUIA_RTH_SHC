export interface PracticeSectionPattern {
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
}
