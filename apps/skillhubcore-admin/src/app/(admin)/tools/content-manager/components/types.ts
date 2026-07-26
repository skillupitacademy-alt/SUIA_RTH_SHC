import {
  TUTORIAL_CONTENT_MANAGER_SECTION_OPTIONS,
  TUTORIAL_SECTION_TABS,
  type TutorialContentManagerSectionId,
} from '@quiz/types';

export type SectionType = TutorialContentManagerSectionId;

export interface SubtopicInfo {
  subtopicId: string;
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
}

export interface AddSectionResponse {
  error?: string;
  details?: string;
  url?: string;
  message?: string;
}

export interface InlineSvgAsset {
  type: 'inline_svg';
  name: string;
  alt: string;
  width: number;
  height: number;
  dataUri: string;
  caption?: string;
}

export interface SvgAssetResponse {
  error?: string;
  asset?: InlineSvgAsset;
}

export type SectionStatus = Record<SectionType, boolean>;

export const sections = TUTORIAL_CONTENT_MANAGER_SECTION_OPTIONS;
export const sectionTabs = TUTORIAL_SECTION_TABS;

export const initialSectionStatus = sections.reduce((status, section) => ({
  ...status,
  [section.id]: false,
}), {} as SectionStatus);

export const SUBSECTIONS_MAP: Record<string, Array<{ id: string; label: string; type: 'json' | 'svg' }>> = {
  notes: [
    { id: 'concept_card', label: 'Hero / Concept Card / Notes Hero (JSON)', type: 'json' },
    { id: 'definition_block', label: 'Definition Block (JSON)', type: 'json' },
    { id: 'component_grid', label: 'Component Grid / Mechanics (JSON)', type: 'json' },
    { id: 'syntax_block', label: 'Syntax Block (JSON)', type: 'json' },
    { id: 'example_panel', label: 'Example Panel / Key Components (JSON)', type: 'json' },
    { id: 'practice_card', label: 'Practice Card / Best Practices (JSON)', type: 'json' },
    { id: 'warning_faq', label: 'Warning FAQ / Common Mistakes (JSON)', type: 'json' },
    { id: 'summary_card', label: 'Summary Card / Visual Summary (JSON)', type: 'json' },
  ],
  layman: [
    { id: 'simpleOverview', label: 'Simple Overview (JSON)', type: 'json' },
    { id: 'everydayAnalogy', label: 'Everyday Analogy (JSON)', type: 'json' },
    { id: 'whyItExists', label: 'Why It Exists (JSON)', type: 'json' },
    { id: 'simpleUseCases', label: 'Simple Use Cases (JSON)', type: 'json' },
    { id: 'beginnerBreakdown', label: 'Beginner Breakdown (JSON)', type: 'json' },
    { id: 'mentalModel', label: 'Mental Model framework (JSON)', type: 'json' },
    { id: 'commonConfusions', label: 'Common Confusions (JSON)', type: 'json' },
    { id: 'simpleRecap', label: 'Simple Recap (JSON)', type: 'json' },
    { id: 'heroVisualSvg', label: 'Hero Visual (SVG)', type: 'svg' },
    { id: 'analogySvg', label: 'Analogy Graphic (SVG)', type: 'svg' },
    { id: 'mentalModelSvg', label: 'Mental Model diagram (SVG)', type: 'svg' },
  ],
  overview: [
    { id: 'hero', label: 'Hero Block (JSON)', type: 'json' },
    { id: 'progressSummary', label: 'Progress Summary (JSON)', type: 'json' },
    { id: 'learningOutcomes', label: 'Learning Outcomes (JSON)', type: 'json' },
    { id: 'learningRoadmap', label: 'Learning Roadmap (JSON)', type: 'json' },
    { id: 'recommendedFlow', label: 'Recommended Flow (JSON)', type: 'json' },
    { id: 'readinessContext', label: 'Readiness Context (JSON)', type: 'json' },
    { id: 'navigation', label: 'Navigation Links (JSON)', type: 'json' },
  ],
  real_life: [
    { id: 'conceptMapping', label: 'Concept Mapping (JSON)', type: 'json' },
    { id: 'industryUseCase', label: 'Industry Use Case (JSON)', type: 'json' },
    { id: 'dailyLifeExample', label: 'Daily Life Example (JSON)', type: 'json' },
    { id: 'careerRelevance', label: 'Career Relevance (JSON)', type: 'json' },
    { id: 'problemSolutionContext', label: 'Problem & Solution (JSON)', type: 'json' },
    { id: 'businessApplication', label: 'Business Application (JSON)', type: 'json' },
    { id: 'domainScenarios', label: 'Domain Scenarios (JSON)', type: 'json' },
    { id: 'practicalRecap', label: 'Practical Recap (JSON)', type: 'json' },
  ],
  technical: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'badge', label: 'Badge (Text)', type: 'json' },
    { id: 'intro', label: 'Introduction (Text)', type: 'json' },
    { id: 'sections', label: 'Technical Sections (JSON)', type: 'json' },
  ],
  code: [
    { id: 'problemContext', label: 'Problem Context (JSON)', type: 'json' },
    { id: 'basicCodeExample', label: 'Basic Code Example (JSON)', type: 'json' },
    { id: 'lineByLineExplanation', label: 'Line-by-Line Explanation (JSON)', type: 'json' },
    { id: 'outputDemonstration', label: 'Output Demonstration (JSON)', type: 'json' },
    { id: 'bestPracticeVersion', label: 'Best Practice Version (JSON)', type: 'json' },
    { id: 'commonMistakes', label: 'Common Mistakes (JSON)', type: 'json' },
    { id: 'realWorldImplementation', label: 'Real World Implementation (JSON)', type: 'json' },
    { id: 'codeSummary', label: 'Code Summary (JSON)', type: 'json' },
  ],
  visual: [
    { id: 'conceptVisualIntro', label: 'Concept Visual Intro (JSON)', type: 'json' },
    { id: 'diagrammaticBreakdown', label: 'Diagrammatic Breakdown (JSON)', type: 'json' },
    { id: 'stepByStepVisualFlow', label: 'Step-by-Step Flow (JSON)', type: 'json' },
    { id: 'comparativeVisualization', label: 'Comparative Visualization (JSON)', type: 'json' },
    { id: 'mentalModelVisualization', label: 'Mental Model Visualization (JSON)', type: 'json' },
    { id: 'realWorldVisualMapping', label: 'Real World Visual Mapping (JSON)', type: 'json' },
    { id: 'commonConfusionVisualization', label: 'Common Confusion Visual (JSON)', type: 'json' },
    { id: 'visualSummary', label: 'Visual Summary (JSON)', type: 'json' },
  ],
  practice: [
    { id: 'assessmentIntro', label: 'Assessment Intro (JSON)', type: 'json' },
    { id: 'conceptRecallQuestions', label: 'Concept Recall Questions (JSON)', type: 'json' },
    { id: 'scenarioBasedQuestions', label: 'Scenario Based Questions (JSON)', type: 'json' },
    { id: 'difficultyProgression', label: 'Difficulty Progression (JSON)', type: 'json' },
    { id: 'instantFeedback', label: 'Instant Feedback Config (JSON)', type: 'json' },
    { id: 'commonMistakeDetection', label: 'Common Mistake Detection (JSON)', type: 'json' },
    { id: 'performanceAnalytics', label: 'Performance Analytics (JSON)', type: 'json' },
    { id: 'revisionRecommendations', label: 'Revision Recommendations (JSON)', type: 'json' },
  ],
  assignment: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'description', label: 'Description (Text)', type: 'json' },
    { id: 'task', label: 'Task Instructions (JSON)', type: 'json' },
    { id: 'objectives', label: 'Learning Objectives (JSON)', type: 'json' },
    { id: 'submissionGuidelines', label: 'Submission Guidelines (JSON)', type: 'json' },
    { id: 'starterCodeTemplate', label: 'Starter Code Template (JSON)', type: 'json' },
    { id: 'solutionRepository', label: 'Solution Repository (JSON)', type: 'json' },
    { id: 'evaluationRubric', label: 'Evaluation Rubric (JSON)', type: 'json' },
  ],
  project: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'description', label: 'Description (Text)', type: 'json' },
    { id: 'requirements', label: 'Requirements (JSON)', type: 'json' },
    { id: 'milestones', label: 'Milestones (JSON)', type: 'json' },
    { id: 'resources', label: 'Resources (JSON)', type: 'json' },
  ],
  quiz: [
    { id: 'title', label: 'Title (Text)', type: 'json' },
    { id: 'description', label: 'Description (Text)', type: 'json' },
    { id: 'questions', label: 'Questions (JSON)', type: 'json' },
  ],
  summary: [
    { id: 'masteryRecapCard', label: 'Mastery Recap Card (JSON)', type: 'json' },
    { id: 'actionableNextSteps', label: 'Actionable Next Steps (JSON)', type: 'json' },
    { id: 'recommendedFlow', label: 'Recommended Flow (JSON)', type: 'json' },
    { id: 'retentionBoosters', label: 'Retention Boosters (JSON)', type: 'json' },
    { id: 'conceptMemoryMap', label: 'Concept Memory Map (JSON)', type: 'json' },
  ],
  interview: [
    { id: 'conceptualQuestions', label: 'Conceptual Questions (JSON)', type: 'json' },
    { id: 'codingScenarios', label: 'Coding Scenarios (JSON)', type: 'json' },
    { id: 'debuggingPuzzles', label: 'Debugging Puzzles (JSON)', type: 'json' },
    { id: 'systemDesignScenarios', label: 'System Design Scenarios (JSON)', type: 'json' },
  ],
  ai_tutor: [
    { id: 'tutorPersona', label: 'Tutor Persona (JSON)', type: 'json' },
    { id: 'guidedExplorationFlow', label: 'Guided Exploration Flow (JSON)', type: 'json' },
    { id: 'interactiveSocraticPrompts', label: 'Interactive Socratic Prompts (JSON)', type: 'json' },
    { id: 'misconceptionRemediationList', label: 'Misconception Remediation List (JSON)', type: 'json' },
  ],
};

export function getDefaultAssetFieldPath(section: SectionType) {
  switch (section) {
    case 'layman':
      return 'everydayAnalogy.image';
    case 'notes':
      return 'summary_card.image';
    case 'code':
      return 'outputDemonstration.previewAsset';
    case 'technical':
      return 'sections.0.diagramAsset';
    case 'summary':
      return 'masteryRecapCard.heroAsset';
    case 'visual':
      return 'conceptVisualIntro.image';
    default:
      return '';
  }
}

export function getAllowedAssetFieldPaths(section: SectionType) {
  switch (section) {
    case 'layman':
      return ['everydayAnalogy.image', 'simpleOverview.image'];
    case 'notes':
      return ['summary_card.image', 'syntax_block.image'];
    case 'code':
      return ['outputDemonstration.previewAsset'];
    case 'technical':
      return ['sections.0.diagramAsset'];
    case 'summary':
      return ['masteryRecapCard.heroAsset'];
    case 'visual':
      return [
        'conceptVisualIntro.image',
        'diagrammaticBreakdown.image',
        'stepByStepVisualFlow.image',
        'comparativeVisualization.image',
        'mentalModelVisualization.image',
        'realWorldVisualMapping.image',
        'commonConfusionVisualization.image',
        'visualSummary.image'
      ];
    default:
      return [] as string[];
  }
}
