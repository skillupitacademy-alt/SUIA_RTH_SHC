export interface CodeSectionPattern {
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
    previewAsset?: any;
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
}
