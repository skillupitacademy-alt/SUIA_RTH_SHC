import { ASSET_SPECS } from './asset-specs';

export const sections = [
  { id: 'master', label: 'Master Prompt' },
  { id: 'overview', label: 'Overview' },
  { id: 'notes', label: 'Notes' },
  { id: 'layman', label: 'Layman' },
  { id: 'real_life', label: 'Real Life' },
  { id: 'technical', label: 'Technical' },
  { id: 'code', label: 'Code' },
  { id: 'visual', label: 'Visual' },
  { id: 'practice', label: 'Practice' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'project', label: 'Project' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'summary', label: 'Summary' },
  { id: 'interview', label: 'Interview' },
  { id: 'ai_tutor', label: 'AI Tutor' },
];

export const SUBSECTIONS_MAP: Record<string, Array<{ id: string; label: string }>> = {
  notes: [
    { id: 'simpleWords', label: 'Simple Words' },
    { id: 'definitionBlock', label: 'Definition Block' },
    { id: 'syntaxBlock', label: 'Syntax Block' },
    { id: 'componentGrid', label: 'Component Grid' },
    { id: 'examplePanel', label: 'Example Panel' },
    { id: 'practiceCard', label: 'Practice Card' },
    { id: 'warningFaq', label: 'Warning FAQ' },
    { id: 'summaryCard', label: 'Summary Card' },
    { id: 'footerBlock', label: 'Footer Block' },
    { id: 'summaryHeroSvg', label: 'Summary Hero (SVG)' },
    { id: 'conceptMemoryMapSvg', label: 'Concept Memory Map (SVG)' },
    { id: 'cheatSheetSVG', label: 'Cheat Sheet (SVG)' },
    { id: 'flashcardVisualSystem', label: 'Flashcard Visual System' },
    { id: 'comparisonSummaryChart', label: 'Comparison Summary Chart' },
    { id: 'mnemonicRetentionGraphic', label: 'Mnemonic Retention Graphic' },
  ],
  layman: [
    { id: 'simpleOverview', label: 'Simple Overview' },
    { id: 'everydayAnalogy', label: 'Everyday Analogy' },
    { id: 'whyItExists', label: 'Why It Exists' },
    { id: 'simpleUseCases', label: 'Simple Use Cases' },
    { id: 'beginnerBreakdown', label: 'Beginner Breakdown' },
    { id: 'mentalModel', label: 'Mental Model framework' },
    { id: 'commonConfusions', label: 'Common Confusions' },
    { id: 'simpleRecap', label: 'Simple Recap' },
    { id: 'heroVisualSvg', label: 'Hero Visual (SVG)' },
    { id: 'analogySvg', label: 'Analogy Graphic (SVG)' },
    { id: 'mentalModelSvg', label: 'Mental Model diagram (SVG)' },
  ],
  overview: [
    { id: 'hero', label: 'Hero Block' },
    { id: 'progressSummary', label: 'Progress Summary' },
    { id: 'learningOutcomes', label: 'Learning Outcomes' },
    { id: 'learningRoadmap', label: 'Learning Roadmap' },
    { id: 'recommendedFlow', label: 'Recommended Flow' },
    { id: 'readinessContext', label: 'Readiness Context' },
    { id: 'navigation', label: 'Navigation Links' },
  ],
  real_life: [
    { id: 'conceptMapping', label: 'Concept Mapping' },
    { id: 'industryUseCase', label: 'Industry Use Case' },
    { id: 'dailyLifeExample', label: 'Daily Life Example' },
    { id: 'careerRelevance', label: 'Career Relevance' },
    { id: 'problemSolutionContext', label: 'Problem & Solution' },
    { id: 'businessApplication', label: 'Business Application' },
    { id: 'domainScenarios', label: 'Domain Scenarios' },
    { id: 'practicalRecap', label: 'Practical Recap' },
  ],
  technical: [
    { id: 'title', label: 'Title' },
    { id: 'badge', label: 'Badge' },
    { id: 'intro', label: 'Introduction' },
    { id: 'sections', label: 'Technical Sections' },
  ],
  code: [
    { id: 'problemContext', label: 'Problem Context' },
    { id: 'basicCodeExample', label: 'Basic Code Example' },
    { id: 'lineByLineExplanation', label: 'Line-by-Line Explanation' },
    { id: 'outputDemonstration', label: 'Output Demonstration' },
    { id: 'bestPracticeVersion', label: 'Best Practice Version' },
    { id: 'commonMistakes', label: 'Common Mistakes' },
    { id: 'realWorldImplementation', label: 'Real World Implementation' },
    { id: 'codeSummary', label: 'Code Summary' },
  ],
  visual: [
    { id: 'conceptVisualIntro', label: 'Concept Visual Intro' },
    { id: 'diagrammaticBreakdown', label: 'Diagrammatic Breakdown' },
    { id: 'stepByStepVisualFlow', label: 'Step-by-Step Flow' },
    { id: 'comparativeVisualization', label: 'Comparative Visualization' },
    { id: 'mentalModelVisualization', label: 'Mental Model Visualization' },
    { id: 'realWorldVisualMapping', label: 'Real World Visual Mapping' },
    { id: 'commonConfusionVisualization', label: 'Common Confusion Visual' },
    { id: 'visualSummary', label: 'Visual Summary' },
  ],
  practice: [
    { id: 'assessmentIntro', label: 'Assessment Intro' },
    { id: 'conceptRecallQuestions', label: 'Concept Recall Questions' },
    { id: 'scenarioBasedQuestions', label: 'Scenario Based Questions' },
    { id: 'difficultyProgression', label: 'Difficulty Progression' },
    { id: 'instantFeedback', label: 'Instant Feedback Config' },
    { id: 'commonMistakeDetection', label: 'Common Mistake Detection' },
    { id: 'performanceAnalytics', label: 'Performance Analytics' },
    { id: 'revisionRecommendations', label: 'Revision Recommendations' },
  ],
  assignment: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'task', label: 'Task Instructions' },
    { id: 'objectives', label: 'Learning Objectives' },
    { id: 'starterCode', label: 'Starter Code' },
    { id: 'submissionGuidelines', label: 'Submission Guidelines' },
  ],
  project: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'deadline', label: 'Deadline' },
    { id: 'hero', label: 'Hero Config' },
    { id: 'realWorldUse', label: 'Real World Use' },
    { id: 'skills', label: 'Skills Addressed' },
    { id: 'buildItems', label: 'Build Phases' },
    { id: 'deliverables', label: 'Deliverables List' },
  ],
  quiz: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'totalQuestions', label: 'Total Questions Count' },
    { id: 'questions', label: 'Questions Pool' },
  ],
  summary: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'masteryRecapCard', label: 'Mastery Recap Card' },
    { id: 'keyTakeawayGrid', label: 'Key Takeaway Grid' },
    { id: 'revisionChecklist', label: 'Revision Checklist' },
    { id: 'nextStepPanel', label: 'Next Step Panel' },
  ],
  interview: [
    { id: 'title', label: 'Title' },
    { id: 'description', label: 'Description' },
    { id: 'interviewIntroCard', label: 'Interview Intro Card' },
    { id: 'questionBankPanel', label: 'Question Bank Panel' },
    { id: 'answerFrameworkCard', label: 'Answer Framework Card' },
    { id: 'mockInterviewFlow', label: 'Mock Interview Flow' },
  ],
  ai_tutor: [
    { id: 'greeting', label: 'Greeting' },
    { id: 'qaPairs', label: 'Q&A Pairs' },
    { id: 'tutorPromptCard', label: 'Tutor Prompt Card' },
    { id: 'misconceptionDetector', label: 'Misconception Detector' },
    { id: 'adaptiveHintPanel', label: 'Adaptive Hint Panel' },
  ],
};

export const findMatchingAsset = (section: string, subsection: string) => {
  const specs = ASSET_SPECS[section];
  if (!specs) return null;
  
  const exactMap: Record<string, string> = {
    'conceptMemoryMap': 'notes-memory-map',
    'conceptMemoryMapSvg': 'notes-memory-map',
    'syntaxBlock': 'notes-syntax',
    'summaryCard': 'notes-summary',
    'footerBlock': 'notes-footer',
    'summaryHeroSvg': 'notes-hero',
    'cheatSheetSVG': 'notes-cheatsheet',
    'flashcardVisualSystem': 'notes-flashcard',
    'comparisonSummaryChart': 'notes-comparison',
    'mnemonicRetentionGraphic': 'notes-mnemonic',
    'everydayAnalogy': 'layman-analogy',
    'analogySvg': 'layman-analogy',
    'mentalModel': 'layman-mental-model',
    'mentalModelSvg': 'layman-mental-model',
    'heroVisualSvg': 'layman-overview',
    'industryUseCase': 'reallife-workflow',
    'careerRelevance': 'reallife-career',
    'businessApplication': 'reallife-business-case',
    'practicalRecap': 'reallife-user-journey',
    'outputDemonstration': 'code-preview',
    'diagrammaticBreakdown': 'visual-hero',
    'stepByStepVisualFlow': 'visual-process-flow',
    'comparativeVisualization': 'visual-comparison',
    'mentalModelVisualization': 'visual-mental-model',
    'realWorldVisualMapping': 'visual-architecture',
    'commonConfusionVisualization': 'visual-timeline',
    'visualSummary': 'visual-summary',
    'assessmentIntro': 'practice-hero',
    'instantFeedback': 'practice-benchmark',
    'task': 'assignment-workflow'
  };

  if (section === 'overview' && subsection === 'hero') return specs.find(a => a.id === 'overview-hero');
  if (section === 'assignment' && subsection === 'title') return specs.find(a => a.id === 'assignment-hero');
  if (section === 'project' && subsection === 'title') return specs.find(a => a.id === 'project-hero');
  if (section === 'project' && subsection === 'buildItems') return specs.find(a => a.id === 'project-roadmap');
  if (section === 'project' && subsection === 'deliverables') return specs.find(a => a.id === 'project-architecture');
  if (section === 'quiz' && subsection === 'title') return specs.find(a => a.id === 'quiz-hero');
  if (section === 'summary' && subsection === 'title') return specs.find(a => a.id === 'summary-mastery');
  if (section === 'interview' && subsection === 'title') return specs.find(a => a.id === 'interview-hero');
  if (section === 'ai_tutor' && subsection === 'title') return specs.find(a => a.id === 'ai-tutor-hero');
  if (section === 'technical' && subsection === 'sections') return specs.find(a => a.id === 'tech-architecture');

  const mappedId = exactMap[subsection];
  if (mappedId) {
    return specs.find(a => a.id === mappedId);
  }

  return specs.find(a => a.fieldPath.toLowerCase().includes(subsection.toLowerCase())) || null;
};
