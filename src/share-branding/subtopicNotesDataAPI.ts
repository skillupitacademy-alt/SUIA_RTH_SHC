/**
 * API-Based Data Loading for Tutorial System
 * 
 * This replaces static file reads with database API calls
 * Fetches content from /api/tutorial/sections/:subtopicId
 */

import { BrandConfig } from './brandConfig';
import { SubtopicNotesViewData } from './subtopicNotesData';

type JsonRecord = Record<string, any>;

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

function camelizeDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelizeDeep(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as JsonRecord).map(([key, child]) => [snakeToCamelKey(key), camelizeDeep(child)])
    ) as T;
  }

  return value;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return '';
}

function normalizeNotesSection(raw: JsonRecord): JsonRecord {
  const content = camelizeDeep(raw || {});
  const definitionBlock = content.definitionBlock;
  const conceptCard = content.conceptCard;
  const syntaxBlock = content.syntaxBlock;

  const sections = Array.isArray(content.sections)
    ? content.sections
    : [
        conceptCard && {
          id: 'concept-card',
          title: firstText(conceptCard.title, conceptCard.headline, 'Concept Explanation'),
          content: firstText(conceptCard.content, conceptCard.description, conceptCard.body),
          keyPoint: firstText(conceptCard.keyPoint, conceptCard.callout),
        },
        syntaxBlock && {
          id: 'syntax-block',
          title: firstText(syntaxBlock.title, syntaxBlock.headline, 'Syntax Structure'),
          content: firstText(syntaxBlock.content, syntaxBlock.description, syntaxBlock.explanation),
          codeExample: syntaxBlock.code || syntaxBlock.codeExample
            ? {
                code: firstText(syntaxBlock.code, syntaxBlock.codeExample?.code),
                output: firstText(syntaxBlock.output, syntaxBlock.codeExample?.output),
              }
            : undefined,
        },
      ].filter(Boolean);

  // Deep normalization for complex panels
  const componentGrid = content.componentGrid || {};
  if (componentGrid && !componentGrid.componentCards) componentGrid.componentCards = [];

  const examplePanel = content.examplePanel || {};
  if (examplePanel && !examplePanel.scenarios) examplePanel.scenarios = [];

  const practiceCard = content.practiceCard || {};
  if (practiceCard && !practiceCard.recommendations) practiceCard.recommendations = [];

  const warningFaq = content.warningFaq || {};
  if (warningFaq && !warningFaq.commonErrors) warningFaq.commonErrors = [];
  if (warningFaq && !warningFaq.faqItems) warningFaq.faqItems = [];

  const summaryCard = content.summaryCard || {};
  if (summaryCard && !summaryCard.keyTakeaways) summaryCard.keyTakeaways = [];
  if (summaryCard && !summaryCard.revisionChecklist) summaryCard.revisionChecklist = [];

  return {
    ...content,
    simpleWords: firstText(content.simpleWords, content.metadata?.summary, definitionBlock?.quickSummary?.[0], definitionBlock?.definitionText),
    definitionBlock,
    sections,
    componentGrid,
    examplePanel,
    practiceCard,
    warningFaq,
    summaryCard,
  };
}

function normalizeLaymanSection(raw: JsonRecord): JsonRecord {
  const content = camelizeDeep(raw || {});

  // Ensure nested objects exist to prevent "Cannot read properties of undefined"
  const everydayAnalogy = content.everydayAnalogy ?? content.analogyCard;
  if (everydayAnalogy && !everydayAnalogy.comparisonPanel) {
    everydayAnalogy.comparisonPanel = {
      realWorld: everydayAnalogy.realWorld || 'Real-world example',
      technical: everydayAnalogy.technical || 'Technical implementation'
    };
  }

  const whyItExists = content.whyItExists ?? content.benefitCard;
  if (whyItExists && !whyItExists.benefitCards) whyItExists.benefitCards = [];

  const simpleUseCases = content.simpleUseCases ?? content.useCaseGrid;
  if (simpleUseCases && !simpleUseCases.useCaseCards) simpleUseCases.useCaseCards = [];

  const beginnerBreakdown = content.beginnerBreakdown ?? content.accordion;
  if (beginnerBreakdown && !beginnerBreakdown.steps) beginnerBreakdown.steps = [];

  const mentalModel = content.mentalModel ?? content.diagramRenderer;
  if (mentalModel && !mentalModel.conceptMap) {
    mentalModel.conceptMap = { nodes: [], connections: [] };
  }

  const commonConfusions = content.commonConfusions ?? content.faqBlock;
  if (commonConfusions && !commonConfusions.confusionItems) commonConfusions.confusionItems = [];
  if (commonConfusions && !commonConfusions.faqItems) commonConfusions.faqItems = [];

  const simpleRecap = content.simpleRecap ?? content.summaryCard;
  if (simpleRecap && !simpleRecap.keyTakeaways) simpleRecap.keyTakeaways = [];
  if (simpleRecap && !simpleRecap.simpleRecapPoints) simpleRecap.simpleRecapPoints = [];

  return {
    ...content,
    simpleOverview: content.simpleOverview ?? content.introCard,
    everydayAnalogy,
    whyItExists,
    simpleUseCases,
    beginnerBreakdown,
    mentalModel,
    commonConfusions,
    simpleRecap,
  };
}

function normalizeRealLifeSection(raw: JsonRecord): JsonRecord {
  const content = camelizeDeep(raw || {});

  const careerRelevance = content.careerRelevance ?? content.careerUseCaseGrid;
  if (careerRelevance && !careerRelevance.careerPaths) careerRelevance.careerPaths = [];

  const domainScenarios = content.domainScenarios ?? content.workflowRenderer;
  if (domainScenarios && !domainScenarios.scenarios) domainScenarios.scenarios = [];

  const practicalRecap = content.practicalRecap ?? content.practicalSummaryCard;
  if (practicalRecap && !practicalRecap.keyApplications) practicalRecap.keyApplications = [];

  return {
    ...content,
    conceptMapping: content.conceptMapping ?? content.contextIntroCard,
    industryUseCase: content.industryUseCase ?? content.industryExampleCard,
    dailyLifeExample: content.dailyLifeExample,
    careerRelevance,
    problemSolutionContext: content.problemSolutionContext ?? content.problemSolutionPanel,
    businessApplication: content.businessApplication ?? content.decisionFrameworkCard,
    domainScenarios,
    practicalRecap,
  };
}

function normalizeCodeSection(raw: JsonRecord): JsonRecord {
  const content = camelizeDeep(raw || {});
  return {
    ...content,
    problemContext: content.problemContext ?? content.problemContextCard,
    basicCodeExample: content.basicCodeExample ?? content.codeBlock,
    lineByLineExplanation: content.lineByLineExplanation ?? content.annotatedCodePanel,
    outputDemonstration: content.outputDemonstration ?? content.outputPreview,
    bestPracticeVersion: content.bestPracticeVersion ?? content.optimizedCodeBlock,
    commonMistakes: content.commonMistakes ?? content.errorPreventionBlock,
    realWorldImplementation: content.realWorldImplementation ?? content.projectUsagePanel,
    codeSummary: content.codeSummary ?? content.codeSummaryCard,
  };
}

function normalizeVisualSection(raw: JsonRecord): JsonRecord {
  const content = camelizeDeep(raw || {});

  // Ensure nested objects exist
  const realWorldVisualMapping = content.realWorldVisualMapping ?? content.realWorldVisualBlock;
  if (realWorldVisualMapping && !realWorldVisualMapping.practicalScenarios) {
    realWorldVisualMapping.practicalScenarios = [];
  }

  return {
    ...content,
    conceptVisualIntro: content.conceptVisualIntro ?? content.visualIntroCard,
    diagrammaticBreakdown: content.diagrammaticBreakdown ?? content.diagramPanel,
    stepByStepVisualFlow: content.stepByStepVisualFlow ?? content.flowSequencePanel,
    comparativeVisualization: content.comparativeVisualization ?? content.comparisonDiagram,
    mentalModelVisualization: content.mentalModelVisualization ?? content.mentalModelCanvas,
    realWorldVisualMapping,
    commonConfusionVisualization: content.commonConfusionVisualization ?? content.confusionResolutionDiagram,
    visualSummary: content.visualSummary ?? content.summaryInfographic,
  };
}

function normalizePracticeSection(raw: JsonRecord): JsonRecord {
  const content = camelizeDeep(raw || {});

  const assessmentIntro = content.assessmentIntro ?? content.assessmentIntroCard;
  if (assessmentIntro && !assessmentIntro.learningGoals) assessmentIntro.learningGoals = [];

  const performanceAnalytics = content.performanceAnalytics || {};
  if (performanceAnalytics) {
    if (!performanceAnalytics.scoreDisplay) performanceAnalytics.scoreDisplay = { currentScore: 0, maxScore: 0, percentage: 0 };
    if (!performanceAnalytics.benchmarkComparison) performanceAnalytics.benchmarkComparison = { userScore: 0, averageScore: 0, topScore: 0 };
  }

  const revisionRecommendations = content.revisionRecommendations || {};
  if (revisionRecommendations) {
    if (!revisionRecommendations.personalizedLearningPath) revisionRecommendations.personalizedLearningPath = [];
    if (!revisionRecommendations.weaknessRecoverySteps) revisionRecommendations.weaknessRecoverySteps = [];
  }

  return {
    ...content,
    assessmentIntro,
    conceptRecallQuestions: content.conceptRecallQuestions ?? content.mcqBlock,
    scenarioBasedQuestions: content.scenarioBasedQuestions ?? content.scenarioTestPanel,
    difficultyProgression: content.difficultyProgression ?? content.adaptiveTestFlow,
    instantFeedback: content.instantFeedback ?? content.feedbackExplanationCard,
    commonMistakeDetection: content.commonMistakeDetection ?? content.mistakeAnalysisPanel,
    performanceAnalytics,
    revisionRecommendations,
  };
}

function normalizeGenericSection(raw: JsonRecord): JsonRecord {
  return camelizeDeep(raw || {});
}

/**
 * Load subtopic data from database via API
 * 
 * @param brand - Brand configuration
 * @param subtopicId - Subtopic slug (e.g., 'component-architecture')
 * @param apiBaseUrl - API base URL (default: current origin)
 * @returns Promise<SubtopicNotesViewData>
 */
export async function loadSubtopicNotesDataFromAPI(
  brand: BrandConfig,
  subtopicId: string = 'component-architecture',
  apiBaseUrl?: string
): Promise<SubtopicNotesViewData> {
  
  // Safety check for undefined subtopicId
  if (!subtopicId) {
    subtopicId = 'component-architecture';
  }

  // Determine API URL
  const baseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const apiUrl = `${baseUrl}/api/tutorial/sections/${subtopicId}`;

  try {
    // Fetch all sections for the subtopic from database
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication (required for protected routes)
      cache: 'no-store' // Always get fresh data
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[loadSubtopicNotesDataFromAPI] API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        error: errorData
      });
      throw new Error(`Failed to fetch content: ${response.statusText} (${response.status}). ${errorData.error || ''}`);
    }

    const data = await response.json();
    
    // Extract sections from API response
    const sections = data.sections || {};
    const subtopicName = data.subtopicName || subtopicId;
    
    // Map of subtopic metadata (can be enhanced with API data later)
    const subtopicInfo = {
      title: subtopicName,
      description: `Learn about ${subtopicName}`,
      level: 'Intermediate',
      topic: 'Programming Concepts'
    };

    // Get content from API response
    const notesContent = normalizeNotesSection(sections.notes || {});
    const laymanContent = normalizeLaymanSection(sections.layman || {});
    const visualContent = normalizeVisualSection(sections.visual || {});
    const realLifeContent = normalizeRealLifeSection(sections.real_life || {});
    const technicalContent = normalizeGenericSection(sections.technical || {});
    const codeContent = normalizeCodeSection(sections.code || {});
    const practiceContent = normalizePracticeSection(sections.practice || {});
    const assignmentContent = normalizeGenericSection(sections.assignment || {});
    const projectContent = normalizeGenericSection(sections.project || {});
    const quizContent = normalizeGenericSection(sections.quiz || {});
    const summaryContent = normalizeGenericSection(sections.summary || {});
    const interviewContent = normalizeGenericSection(sections.interview || {});
    const aiTutorContent = normalizeGenericSection(sections.ai_tutor || {});

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
          { id: 'summary', label: 'Summary', status: 'pending', icon: 'FileCheck' },
          { id: 'interview', label: 'Interview Prep', status: 'pending', icon: 'MessagesSquare' },
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
        simpleWords: notesContent.simpleWords || '',
        definitionBlock: notesContent.definitionBlock,
        sections: notesContent.sections || [],
        componentGrid: notesContent.componentGrid,
        examplePanel: notesContent.examplePanel,
        practiceCard: notesContent.practiceCard,
        warningFaq: notesContent.warningFaq,
        summaryCard: notesContent.summaryCard,
        ...(laymanContent && Object.keys(laymanContent).length > 0 && { laymanExplanation: laymanContent }),
        ...(realLifeContent && Object.keys(realLifeContent).length > 0 && { realLifeExamples: realLifeContent }),
        ...(technicalContent && Object.keys(technicalContent).length > 0 && { technicalDeepDive: technicalContent }),
        ...(codeContent && Object.keys(codeContent).length > 0 && { codeExample: codeContent }),
        ...(visualContent && Object.keys(visualContent).length > 0 && { visualExplanation: visualContent }),
        ...(practiceContent && Object.keys(practiceContent).length > 0 && { practiceTest: practiceContent }),
        ...(assignmentContent && Object.keys(assignmentContent).length > 0 && { assignment: assignmentContent }),
        ...(projectContent && Object.keys(projectContent).length > 0 && { project: projectContent }),
        ...(quizContent && Object.keys(quizContent).length > 0 && { quiz: quizContent }),
        ...(summaryContent && Object.keys(summaryContent).length > 0 && { summary: summaryContent }),
        ...(interviewContent && Object.keys(interviewContent).length > 0 && { interview: interviewContent }),
        ...(aiTutorContent && Object.keys(aiTutorContent).length > 0 && { aiTutorContent })
      } as any,
      rightSidebar: {
        aiTutor: {
          title: `${brand.tutorLabel || 'Tutor'} (Ask Anything)`,
          messages: Array.isArray(aiTutorContent.qaPairs) && aiTutorContent.qaPairs.length > 0
            ? aiTutorContent.qaPairs.slice(0, 3).flatMap((pair: JsonRecord) => [
                { text: firstText(pair.question), time: '2:30 PM', sender: 'user' as const },
                { text: firstText(pair.answer), time: '2:31 PM', sender: 'bot' as const }
              ])
            : [
                { text: `What is ${subtopicInfo.title.toLowerCase()}?`, time: '2:30 PM', sender: 'user' },
                { text: `${notesContent.simpleWords?.substring(0, 100) || firstText(aiTutorContent.greeting, 'Let me explain')}... Would you like to see an example?`, time: '2:30 PM', sender: 'bot' }
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
          quickSummary: laymanContent?.simpleOverview?.quickSummary || [
            'Learn the basics',
            'Understand core concepts',
            'Apply in real projects'
          ],
          keyTerms: [
            { term: 'Component', definition: 'A reusable building block' },
            { term: 'Props', definition: 'Data passed into a component' },
            { term: 'State', definition: 'Internal data of a component' }
          ],
          readingTime: '5 - 7 minutes',
          thinkAboutIt: "Think about how you can apply these concepts in your own projects!"
        },
        deepDiveSidebar: {
          onThisPage: [
            { id: 'anatomy', label: 'Component Anatomy' },
            { id: 'reconciliation', label: 'Reconciliation' },
            { id: 'resolution', label: 'Component Resolution' }
          ],
          quickLinks: [
            { id: 'ql1', label: 'Documentation', icon: 'ExternalLink' },
            { id: 'ql2', label: 'Best Practices', icon: 'BookOpen' },
            { id: 'ql3', label: 'Code Examples', icon: 'Code2' }
          ]
        }
      }
    };
    
  } catch (error) {
    console.error('[loadSubtopicNotesDataFromAPI] Error:', error);
    throw new Error(`Failed to load content for subtopic: ${subtopicId}. ${error}`);
  }
}

/**
 * Helper function to submit quiz answer
 */
export async function submitQuizAnswer(
  userId: string,
  sectionId: string,
  questionId: string,
  selectedAnswer: string,
  correctAnswer: string,
  timeSpent: number = 0
) {
  const response = await fetch('/api/tutorial/interactions/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sectionId,
      questionId,
      selectedAnswer,
      correctAnswer,
      timeSpent
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit quiz answer');
  }
  
  return response.json();
}

/**
 * Helper function to submit practice test answer
 */
export async function submitPracticeAnswer(
  userId: string,
  sectionId: string,
  questionId: string,
  selectedAnswer: string,
  correctAnswer: string,
  timeSpent: number = 0,
  feedbackViewed: boolean = false
) {
  const response = await fetch('/api/tutorial/interactions/practice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sectionId,
      questionId,
      selectedAnswer,
      correctAnswer,
      timeSpent,
      feedbackViewed
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit practice answer');
  }
  
  return response.json();
}

/**
 * Helper function to track code interaction
 */
export async function trackCodeInteraction(
  userId: string,
  sectionId: string,
  codeExampleId: string,
  userCode: string,
  executed: boolean = false,
  executionResult?: { success: boolean; output?: string; error?: string },
  timeSpent: number = 0
) {
  const response = await fetch('/api/tutorial/interactions/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sectionId,
      codeExampleId,
      userCode,
      executed,
      executionResult,
      timeSpent
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to track code interaction');
  }
  
  return response.json();
}

/**
 * Helper function to track visual interaction
 */
export async function trackVisualInteraction(
  userId: string,
  sectionId: string,
  componentId: string,
  interactionType: 'view' | 'expand' | 'navigate' | 'interact',
  interactionData?: any,
  timeSpent: number = 0
) {
  const response = await fetch('/api/tutorial/interactions/visual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sectionId,
      componentId,
      interactionType,
      interactionData,
      timeSpent
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to track visual interaction');
  }
  
  return response.json();
}

/**
 * Helper function to mark section as completed
 */
export async function markSectionComplete(
  userId: string,
  sectionId: string,
  subsectionId?: string,
  timeSpent: number = 0,
  score?: number
) {
  const response = await fetch('/api/tutorial/interactions/completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      sectionId,
      subsectionId,
      timeSpent,
      score
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to mark section as complete');
  }
  
  return response.json();
}
