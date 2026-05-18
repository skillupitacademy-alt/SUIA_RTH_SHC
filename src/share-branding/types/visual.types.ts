export interface VisualSectionPattern {
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
}
