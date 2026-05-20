export interface NotesSectionPattern {
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
}
