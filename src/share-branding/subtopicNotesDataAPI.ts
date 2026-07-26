/**
 * API-Based Data Loading for Tutorial System
 * 
 * This replaces static file reads with database API calls
 * Fetches content from /api/tutorial/sections/:subtopicId
 */

import { BrandConfig } from './brandConfig';
import { SubtopicNotesViewData } from './subtopicNotesData';
import {
  calculateTutorialProgress,
  formatTutorialSectionValidationIssues,
  type TutorialMasterySectionId,
  type ValidatedTutorialSection,
  validateTutorialSection,
} from '@quiz/validation';

type JsonRecord = Record<string, any>;
type LoadedSection<TSection extends TutorialMasterySectionId> = {
  data?: ValidatedTutorialSection<TSection>;
  error?: string;
};

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return '';
}

function strictSectionError(sectionType: TutorialMasterySectionId, detail: string): string {
  return `This tutorial section failed schema validation and must be regenerated. Section: ${sectionType}. ${detail}`;
}

function loadStrictSection<TSection extends TutorialMasterySectionId>(
  sections: Record<string, unknown>,
  sectionType: TSection
): LoadedSection<TSection> {
  if (!Object.prototype.hasOwnProperty.call(sections, sectionType)) {
    return { error: strictSectionError(sectionType, 'Missing required DB section.') };
  }

  const rawSection = sections[sectionType];
  const validation = validateTutorialSection(sectionType, rawSection);
  if (!validation.success) {
    return { error: strictSectionError(sectionType, formatTutorialSectionValidationIssues(validation.issues)) };
  }

  return { data: validation.data };
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

const NOTES_BLOCK_KEY_MAP = {
  concept_card: ['simpleWords', 'sections'],
  definition_block: ['definitionBlock'],
  component_grid: ['componentGrid'],
  syntax_block: ['syntaxBlock'],
  example_panel: ['examplePanel'],
  practice_card: ['practiceCard'],
  warning_faq: ['warningFaq'],
  summary_card: ['summaryCard'],
  summary_hero_infographic: ['summaryHeroInfographic'],
  concept_memory_map: ['conceptMemoryMap'],
  cheat_sheet_svg: ['cheatSheetSVG'],
  flashcard_visual_system: ['flashcardVisualSystem'],
  comparison_summary_chart: ['comparisonSummaryChart'],
  mnemonic_retention_graphic: ['mnemonicRetentionGraphic'],
  footer_block: ['footerBlock'],
} as const;

function getNotesBlockEnabledState(notesContent: JsonRecord | undefined) {
  const enabledBlocks: Record<string, boolean> = {};
  const uiuxContract = notesContent?.uiux_contract;
  const uiuxRecord = uiuxContract && typeof uiuxContract === 'object' && !Array.isArray(uiuxContract)
    ? uiuxContract as JsonRecord
    : {};
  const componentsRecord = uiuxRecord.components && typeof uiuxRecord.components === 'object' && !Array.isArray(uiuxRecord.components)
    ? uiuxRecord.components as JsonRecord
    : uiuxRecord.component_design_system && typeof uiuxRecord.component_design_system === 'object' && !Array.isArray(uiuxRecord.component_design_system)
      ? uiuxRecord.component_design_system as JsonRecord
      : uiuxRecord;

  for (const [canonicalKey, viewKeys] of Object.entries(NOTES_BLOCK_KEY_MAP)) {
    const componentConfig = componentsRecord[canonicalKey] ?? uiuxRecord[canonicalKey];
    const configRecord = componentConfig && typeof componentConfig === 'object' && !Array.isArray(componentConfig)
      ? componentConfig as JsonRecord
      : {};
    const explicitState = configRecord.enabled ?? configRecord.visible;

    if (typeof explicitState === 'boolean') {
      for (const viewKey of viewKeys) {
        enabledBlocks[viewKey] = explicitState;
      }
    }
  }

  return enabledBlocks;
}

function toLegacyDefinitionBlock(definitionBlock: JsonRecord | undefined, summaryTakeaways: string[]) {
  if (!definitionBlock) return undefined;

  return {
    badge: firstText(definitionBlock.badge, 'Core Concept'),
    headline: firstText(definitionBlock.headline, 'Definition'),
    definitionText: firstText(definitionBlock.definitionText, definitionBlock.definition),
    importanceCallout: firstText(definitionBlock.importanceCallout, definitionBlock.whyItMatters),
    quickSummary: summaryTakeaways.length > 0
      ? summaryTakeaways
      : [firstText(definitionBlock.simpleExplanation, definitionBlock.definition)].filter(Boolean),
  };
}

function toLegacyConceptSections(conceptCard: JsonRecord | undefined) {
  if (!conceptCard) return [];

  return [{
    id: 'concept-card',
    title: firstText(conceptCard.heroTitle, 'Concept Overview'),
    content: firstText(conceptCard.heroSubtitle),
    keyPoint: asArray<string>(conceptCard.quickLook).filter(Boolean).join(' | '),
  }];
}

function toLegacyComponentGrid(componentGrid: JsonRecord | undefined) {
  if (!componentGrid) return undefined;

  return {
    gridTitle: firstText(componentGrid.gridTitle, componentGrid.panelTitle, 'How It Works'),
    componentCards: asArray<JsonRecord>(componentGrid.componentCards ?? componentGrid.mechanics).map((item, index) => ({
      id: firstText(item.id, `component-${index + 1}`),
      title: firstText(item.title, item.label, `Part ${index + 1}`),
      description: firstText(item.description, item.detail),
      icon: firstText(item.icon, item.iconName, 'Box'),
      subcomponents: asArray<string>(item.subcomponents ?? item.points).filter(Boolean),
    })),
  };
}

function toLegacySyntaxBlock(syntaxBlock: JsonRecord | undefined) {
  if (!syntaxBlock) return undefined;

  return {
    image: syntaxBlock.image,
    code: firstText(syntaxBlock.code, syntaxBlock.codeSnippet),
    language: firstText(syntaxBlock.language, 'python'),
    title: firstText(syntaxBlock.title, 'Syntax Block'),
    subtitle: firstText(syntaxBlock.subtitle, 'Basic Syntax'),
    explanations: asArray<JsonRecord>(syntaxBlock.explanations ?? syntaxBlock.breakdown).map((item, index) => ({
      id: firstText(item.id, `syntax-${index + 1}`),
      term: firstText(item.term, item.part),
      explanation: firstText(item.explanation),
    })),
  };
}

function toLegacyExamplePanel(examplePanel: JsonRecord | undefined) {
  if (!examplePanel) return undefined;

  return {
    exampleTitle: firstText(examplePanel.exampleTitle, examplePanel.title, 'Examples'),
    scenarios: asArray<JsonRecord>(examplePanel.scenarios ?? examplePanel.components).map((item, index) => ({
      id: firstText(item.id, `example-${index + 1}`),
      title: firstText(item.title, `Example ${index + 1}`),
      scenarioDescription: firstText(item.scenarioDescription, item.description),
      practicalSolution: asArray<string>(item.points).join(', ') || firstText(item.practicalSolution, item.description),
      industryContext: firstText(item.industryContext, 'Python usage'),
    })),
  };
}

function toLegacyPracticeCard(practiceCard: JsonRecord | undefined) {
  if (!practiceCard) return undefined;

  const practices = asArray<JsonRecord>(practiceCard.recommendations ?? practiceCard.practices);
  return {
    bestPracticeTitle: firstText(practiceCard.bestPracticeTitle, practiceCard.title, 'Best Practices'),
    recommendations: practices.map((item, index) => ({
      id: firstText(item.id, `practice-${index + 1}`),
      title: firstText(item.title, item.label, `Practice ${index + 1}`),
      description: firstText(item.description, item.tip),
    })),
    optimizationTips: asArray<string>(practiceCard.optimizationTips).length > 0
      ? asArray<string>(practiceCard.optimizationTips)
      : practices.map((item) => firstText(item.tip, item.description)).filter(Boolean),
    industryStandards: asArray<string>(practiceCard.industryStandards).length > 0
      ? asArray<string>(practiceCard.industryStandards)
      : ['Clear naming', 'Small tests', 'Consistent indentation'],
  };
}

function toLegacyWarningFaq(warningFaq: JsonRecord | undefined) {
  if (!warningFaq) return undefined;

  return {
    faqItems: asArray<JsonRecord>(warningFaq.faqItems ?? warningFaq.mistakes).map((item, index) => ({
      id: firstText(item.id, `mistake-${index + 1}`),
      question: firstText(item.question, item.mistake),
      answer: firstText(item.answer, item.fix),
    })),
  };
}

function toLegacySummaryCard(summaryCard: JsonRecord | undefined) {
  if (!summaryCard) return undefined;

  const takeaways = asArray<string>(summaryCard.keyTakeaways);
  return {
    image: summaryCard.image,
    summaryTitle: firstText(summaryCard.summaryTitle, 'Summary'),
    keyTakeaways: takeaways,
    revisionChecklist: asArray<JsonRecord>(summaryCard.revisionChecklist).length > 0
      ? asArray<JsonRecord>(summaryCard.revisionChecklist)
      : takeaways.map((item, index) => ({ id: `takeaway-${index + 1}`, item, checked: false })),
    memoryReinforcement: firstText(summaryCard.memoryReinforcement, summaryCard.conceptDiagramDescription),
    examTips: asArray<string>(summaryCard.examTips).length > 0
      ? asArray<string>(summaryCard.examTips)
      : takeaways,
  };
}

/**
 * Load subtopic data from database via API
 * 
 * @param brand - Brand configuration
 * @param subtopicId - Subtopic slug (e.g., 'component-architecture')
 * @param apiBaseUrl - API base URL (default: current origin)
 * @returns Promise<SubtopicNotesViewData>
 */
export function buildSubtopicNotesDataFromSectionsResponse(
  brand: BrandConfig,
  subtopicId: string,
  data: { subtopicName?: string; sectionMeta?: Record<string, JsonRecord>; sections?: Record<string, unknown> }
): SubtopicNotesViewData {
  const sections = data.sections || {};
  const sectionMeta = data.sectionMeta || {};
  const sectionRecordIds = Object.fromEntries(
    Object.entries(sectionMeta as Record<string, JsonRecord>)
      .filter(([, meta]) => typeof meta?.id === 'string')
      .map(([sectionType, meta]) => [sectionType, meta.id as string])
  );
  const subtopicName = data.subtopicName || subtopicId;

  const subtopicInfo = {
    title: subtopicName,
    description: `Learn about ${subtopicName}`,
    level: 'Intermediate',
    topic: 'Programming Concepts'
  };

  const loadedSections = {
    notes: loadStrictSection(sections, 'notes'),
    layman: loadStrictSection(sections, 'layman'),
    real_life: loadStrictSection(sections, 'real_life'),
    technical: loadStrictSection(sections, 'technical'),
    code: loadStrictSection(sections, 'code'),
    visual: loadStrictSection(sections, 'visual'),
    practice: loadStrictSection(sections, 'practice'),
    assignment: loadStrictSection(sections, 'assignment'),
    project: loadStrictSection(sections, 'project'),
    quiz: loadStrictSection(sections, 'quiz'),
    summary: loadStrictSection(sections, 'summary'),
    interview: loadStrictSection(sections, 'interview'),
    ai_tutor: loadStrictSection(sections, 'ai_tutor'),
  };
  const sectionErrors = Object.fromEntries(
    Object.entries(loadedSections)
      .filter((entry): entry is [TutorialMasterySectionId, { error: string }] => typeof entry[1].error === 'string')
      .map(([sectionType, result]) => [sectionType, result.error])
  );

  const notesContent = loadedSections.notes.data;
  const laymanContent = loadedSections.layman.data;
  const visualContent = loadedSections.visual.data;
  const realLifeContent = loadedSections.real_life.data;
  const technicalContent = loadedSections.technical.data;
  const codeContent = loadedSections.code.data;
  const practiceContent = loadedSections.practice.data;
  const assignmentContent = loadedSections.assignment.data;
  const projectContent = loadedSections.project.data;
  const quizContent = loadedSections.quiz.data;
  const summaryContent = loadedSections.summary.data;
  const interviewContent = loadedSections.interview.data;
  const aiTutorContent = loadedSections.ai_tutor.data;
  const conceptCard = notesContent?.concept_card as JsonRecord | undefined;
  const definitionBlock = notesContent?.definition_block as JsonRecord | undefined;
  const componentGrid = notesContent?.component_grid as JsonRecord | undefined;
  const syntaxBlock = notesContent?.syntax_block as JsonRecord | undefined;
  const examplePanel = notesContent?.example_panel as JsonRecord | undefined;
  const practiceCard = notesContent?.practice_card as JsonRecord | undefined;
  const warningFaq = notesContent?.warning_faq as JsonRecord | undefined;
  const summaryCard = notesContent?.summary_card as JsonRecord | undefined;
  const summaryTakeaways = asArray<string>(summaryCard?.keyTakeaways).filter(Boolean);
  const enabledNotesBlocks = getNotesBlockEnabledState(notesContent);
  const progressSnapshot = calculateTutorialProgress({ completedSections: [] });

  return {
    sectionErrors,
    sectionRecordIds,
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
        percentage: progressSnapshot.completionPercent,
        message: `${progressSnapshot.completionPercent}% Complete`
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
      simpleWords: conceptCard?.heroSubtitle ?? '',
      canonicalNotes: notesContent,
      enabledNotesBlocks,
      definitionBlock: toLegacyDefinitionBlock(definitionBlock, summaryTakeaways),
      sections: toLegacyConceptSections(conceptCard),
      componentGrid: toLegacyComponentGrid(componentGrid),
      examplePanel: toLegacyExamplePanel(examplePanel),
      practiceCard: toLegacyPracticeCard(practiceCard),
      warningFaq: toLegacyWarningFaq(warningFaq),
      summaryCard: toLegacySummaryCard(summaryCard),
      syntaxBlock: toLegacySyntaxBlock(syntaxBlock),

      laymanExplanation: laymanContent,
      realLifeExamples: realLifeContent,
      technicalDeepDive: technicalContent,
      codeExample: codeContent,

      // Keep existing full Visual Explanation tab as-is.
      visualExplanation: visualContent,

      practiceTest: practiceContent,
      assignment: assignmentContent,
      project: projectContent,
      quiz: quizContent,
      summary: summaryContent,
      interview: interviewContent,
      aiTutorContent
    } as any,
    rightSidebar: {
      aiTutor: {
        title: `${brand.tutorLabel || 'Tutor'} (Ask Anything)`,
        messages: (aiTutorContent?.qaPairs ?? []).slice(0, 3).flatMap((pair) => [
          { text: firstText(pair.question), time: '2:30 PM', sender: 'user' as const },
          { text: firstText(pair.answer), time: '2:31 PM', sender: 'bot' as const }
        ]),
        inputPlaceholder: 'Ask a follow-up...'
      },
      courseProgress: {
        percentage: progressSnapshot.completionPercent,
        courseName: subtopicInfo.topic,
        label: `${progressSnapshot.completionPercent}% Completed`
      },
      xpStats: {
        earned: 50,
        total: 2450
      },
      relatedSubtopics: [
      ],
      laymanSidebar: {
        quickSummary: notesContent?.summary_card?.keyTakeaways ?? [],
        keyTerms: [],
        readingTime: '',
        thinkAboutIt: ''
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
}

export async function loadSubtopicNotesDataFromAPI(
  brand: BrandConfig,
  subtopicId: string = 'component-architecture',
  apiBaseUrl?: string
): Promise<SubtopicNotesViewData> {
  if (!subtopicId) {
    subtopicId = 'component-architecture';
  }

  const baseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const apiUrl = `${baseUrl}/api/tutorial/sections/${subtopicId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store'
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
    return buildSubtopicNotesDataFromSectionsResponse(brand, subtopicId, data);
  } catch (error) {
    console.error('[loadSubtopicNotesDataFromAPI] Error:', error);
    throw new Error(`Failed to load content for subtopic: ${subtopicId}. ${error}`);
  }
}

/**
 * Helper function to submit quiz answer
 */
export async function submitQuizAnswer(
  _userId: string,
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
  _userId: string,
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
  _userId: string,
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
  _userId: string,
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
  _userId: string,
  sectionId: string,
  subsectionId?: string,
  timeSpent: number = 0,
  score?: number
) {
  const response = await fetch('/api/tutorial/interactions/completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
