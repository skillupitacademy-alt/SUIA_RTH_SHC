export interface LaymanSectionPattern {
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
}
