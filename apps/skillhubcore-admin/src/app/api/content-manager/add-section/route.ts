import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  tutorialDomains,
  tutorialSections,
  tutorialSubjects,
  tutorialSubtopics,
  tutorialTopics,
  tutorialSectionOverview,
  tutorialSectionNotes,
  tutorialSectionLayman,
  tutorialSectionRealLife,
  tutorialSectionTechnical,
  tutorialSectionCode,
  tutorialSectionVisual,
  tutorialSectionPractice,
  tutorialSectionAssignment,
  tutorialSectionProject,
  tutorialSectionQuiz,
  tutorialSectionSummary,
  tutorialSectionInterview,
  tutorialSectionAITutor,
} from '@quiz/db-tutorial';
import {
  getTutorialSectionContractByAdminId,
  type TutorialAdminSectionId,
  type TutorialSectionContract,
  type TutorialSectionId,
} from '@quiz/types';
import {
  formatTutorialSectionValidationIssues,
  validateTutorialSection,
  type TutorialSectionValidationIssue,
} from '@quiz/validation';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

type JsonRecord = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DOMAIN_TABLE_MAP: Record<string, any> = {
  overview: tutorialSectionOverview,
  notes: tutorialSectionNotes,
  layman: tutorialSectionLayman,
  real_life: tutorialSectionRealLife,
  technical: tutorialSectionTechnical,
  code: tutorialSectionCode,
  visual: tutorialSectionVisual,
  practice: tutorialSectionPractice,
  assignment: tutorialSectionAssignment,
  project: tutorialSectionProject,
  quiz: tutorialSectionQuiz,
  summary: tutorialSectionSummary,
  interview: tutorialSectionInterview,
  ai_tutor: tutorialSectionAITutor,
};

const DOMAIN_TABLE_DEFAULTS: Record<string, Record<string, unknown>> = {
  overview: {
    hero: {},
    progressSummary: {},
    learningOutcomes: [],
    learningRoadmap: {},
    recommendedFlow: [],
    readinessContext: {},
    navigation: {},
  },
  notes: {
    simpleWords: '',
    definitionBlock: {},
    sections: [],
    componentGrid: {},
    examplePanel: {},
    practiceCard: {},
    warningFaq: {},
    summaryCard: {},
    syntaxBlock: null,
    footerBlock: null,
    summaryHeroSvg: null,
    conceptMemoryMapSvg: null,
    cheatSheetSVG: null,
  },
  layman: {
    simpleOverview: {},
    everydayAnalogy: {},
    whyItExists: {},
    simpleUseCases: {},
    beginnerBreakdown: {},
    mentalModel: {},
    commonConfusions: {},
    simpleRecap: {},
    heroVisualSvg: null,
    analogySvg: null,
    mentalModelSvg: null,
  },
  real_life: {
    conceptMapping: {},
    industryUseCase: {},
    dailyLifeExample: {},
    careerRelevance: {},
    problemSolutionContext: {},
    businessApplication: {},
    domainScenarios: {},
    practicalRecap: {},
  },
  technical: {
    title: '',
    badge: '',
    intro: '',
    sections: [],
  },
  code: {
    problemContext: {},
    basicCodeExample: {},
    lineByLineExplanation: {},
    outputDemonstration: {},
    bestPracticeVersion: {},
    commonMistakes: {},
    realWorldImplementation: {},
    codeSummary: {},
  },
  visual: {
    conceptVisualIntro: {},
    diagrammaticBreakdown: {},
    stepByStepVisualFlow: {},
    comparativeVisualization: {},
    mentalModelVisualization: {},
    realWorldVisualMapping: {},
    commonConfusionVisualization: {},
    visualSummary: {},
  },
  practice: {
    assessmentIntro: {},
    conceptRecallQuestions: {},
    scenarioBasedQuestions: {},
    instantFeedback: {},
    difficultyProgression: {},
    commonMistakeDetection: {},
    performanceAnalytics: {},
    revisionRecommendations: {},
  },
  assignment: {
    title: '',
    description: '',
    xp: 150,
    duration: '20 Mins',
    task: {},
    objectives: [],
    starterCode: '',
    submissionGuidelines: [],
  },
  project: {
    title: '',
    description: '',
    xp: 500,
    deadline: '2 Days Left',
    hero: {},
    realWorldUse: '',
    skills: [],
    buildItems: [],
    deliverables: [],
  },
  quiz: {
    title: '',
    description: '',
    totalQuestions: 0,
    duration: '15 min',
    xp: 100,
    questions: [],
  },
  summary: {
    title: '',
    description: '',
    masteryRecapCard: {},
    keyTakeawayGrid: [],
    revisionChecklist: [],
    nextStepPanel: {},
  },
  interview: {
    title: '',
    description: '',
    interviewIntroCard: {},
    questionBankPanel: {},
    answerFrameworkCard: {},
    mockInterviewFlow: {},
  },
  ai_tutor: {
    greeting: '',
    qaPairs: [],
    tutorPromptCard: {},
    misconceptionDetector: {},
    adaptiveHintPanel: {},
  },
};

const COLUMN_TO_PARENT_KEY: Record<string, string> = {
  summaryHeroSvg: 'summaryHeroInfographic.image',
  conceptMemoryMapSvg: 'conceptMemoryMap.image',
  cheatSheetSVG: 'cheatSheetSVG.image',
  heroVisualSvg: 'simpleOverview.heroVisual',
  analogySvg: 'everydayAnalogy.image',
  mentalModelSvg: 'mentalModel.image',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertChildDomainTable(tx: any, sectionId: string, sectionType: string, content: any) {
  const table = DOMAIN_TABLE_MAP[sectionType];
  if (!table) return;

  const [existing] = await tx
    .select()
    .from(table)
    .where(eq(table.sectionId, sectionId))
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: Record<string, any> = { sectionId };

  switch (sectionType) {
    case 'overview':
      values.hero = content.hero || {};
      values.progressSummary = content.progressSummary || {};
      values.learningOutcomes = content.learningOutcomes || [];
      values.learningRoadmap = content.learningRoadmap || {};
      values.recommendedFlow = content.recommendedFlow || [];
      values.readinessContext = content.readinessContext || {};
      values.navigation = content.navigation || {};
      break;

    case 'notes':
      values.simpleWords = content.simpleWords || '';
      values.definitionBlock = content.definitionBlock || {};
      values.sections = content.sections || [];
      values.componentGrid = content.componentGrid || {};
      values.examplePanel = content.examplePanel || {};
      values.practiceCard = content.practiceCard || {};
      values.warningFaq = content.warningFaq || {};
      values.summaryCard = content.summaryCard || {};
      values.syntaxBlock = content.syntaxBlock || null;
      values.footerBlock = content.footerBlock || null;
      values.summaryHeroSvg = content.summaryHeroInfographic || null;
      values.conceptMemoryMapSvg = content.conceptMemoryMap || null;
      values.cheatSheetSVG = content.cheatSheetSVG || null;
      break;

    case 'layman':
      values.simpleOverview = content.simpleOverview || {};
      values.everydayAnalogy = content.everydayAnalogy || {};
      values.whyItExists = content.whyItExists || {};
      values.simpleUseCases = content.simpleUseCases || {};
      values.beginnerBreakdown = content.beginnerBreakdown || {};
      values.mentalModel = content.mentalModel || {};
      values.commonConfusions = content.commonConfusions || {};
      values.simpleRecap = content.simpleRecap || {};
      values.heroVisualSvg = content.simpleOverview?.heroVisual || null;
      values.analogySvg = content.everydayAnalogy?.image || null;
      values.mentalModelSvg = content.mentalModel?.image || null;
      break;

    case 'real_life':
      values.conceptMapping = content.conceptMapping || {};
      values.industryUseCase = content.industryUseCase || {};
      values.dailyLifeExample = content.dailyLifeExample || {};
      values.careerRelevance = content.careerRelevance || {};
      values.problemSolutionContext = content.problemSolutionContext || {};
      values.businessApplication = content.businessApplication || {};
      values.domainScenarios = content.domainScenarios || {};
      values.practicalRecap = content.practicalRecap || {};
      break;

    case 'technical':
      values.title = content.title || '';
      values.badge = content.badge || '';
      values.intro = content.intro || '';
      values.sections = content.sections || [];
      break;

    case 'code':
      values.problemContext = content.problemContext || {};
      values.basicCodeExample = content.basicCodeExample || {};
      values.lineByLineExplanation = content.lineByLineExplanation || {};
      values.outputDemonstration = content.outputDemonstration || {};
      values.bestPracticeVersion = content.bestPracticeVersion || {};
      values.commonMistakes = content.commonMistakes || {};
      values.realWorldImplementation = content.realWorldImplementation || {};
      values.codeSummary = content.codeSummary || {};
      break;

    case 'visual':
      values.conceptVisualIntro = content.conceptVisualIntro || {};
      values.diagrammaticBreakdown = content.diagrammaticBreakdown || {};
      values.stepByStepVisualFlow = content.stepByStepVisualFlow || {};
      values.comparativeVisualization = content.comparativeVisualization || {};
      values.mentalModelVisualization = content.mentalModelVisualization || {};
      values.realWorldVisualMapping = content.realWorldVisualMapping || {};
      values.commonConfusionVisualization = content.commonConfusionVisualization || {};
      values.visualSummary = content.visualSummary || {};
      break;

    case 'practice':
      values.assessmentIntro = content.assessmentIntro || {};
      values.conceptRecallQuestions = content.conceptRecallQuestions || {};
      values.scenarioBasedQuestions = content.scenarioBasedQuestions || {};
      values.instantFeedback = content.instantFeedback || {};
      break;

    case 'assignment':
      values.title = content.title || '';
      values.description = content.description || '';
      values.xp = content.xp || 150;
      values.duration = content.duration || '20 Mins';
      values.task = content.task || {};
      values.objectives = content.objectives || [];
      values.starterCode = content.starterCode || '';
      values.submissionGuidelines = content.submissionGuidelines || [];
      break;

    case 'project':
      values.title = content.title || '';
      values.description = content.description || '';
      values.xp = content.xp || 500;
      values.deadline = content.deadline || '2 Days Left';
      values.hero = content.hero || {};
      values.realWorldUse = content.realWorldUse || '';
      values.skills = content.skills || [];
      values.buildItems = content.buildItems || [];
      values.deliverables = content.deliverables || [];
      break;

    case 'quiz':
      values.title = content.title || '';
      values.description = content.description || '';
      values.totalQuestions = content.totalQuestions || 0;
      values.duration = content.duration || '15 min';
      values.xp = content.xp || 100;
      values.questions = content.questions || [];
      break;

    case 'summary':
      values.title = content.title || '';
      values.description = content.description || '';
      values.masteryRecapCard = content.masteryRecapCard || {};
      values.keyTakeawayGrid = content.keyTakeawayGrid || [];
      values.revisionChecklist = content.revisionChecklist || [];
      values.nextStepPanel = content.nextStepPanel || {};
      break;

    case 'interview':
      values.title = content.title || '';
      values.description = content.description || '';
      values.interviewIntroCard = content.interviewIntroCard || {};
      values.questionBankPanel = content.questionBankPanel || {};
      values.answerFrameworkCard = content.answerFrameworkCard || {};
      values.mockInterviewFlow = content.mockInterviewFlow || {};
      break;

    case 'ai_tutor':
      values.greeting = content.greeting || '';
      values.qaPairs = content.qa_pairs || [];
      values.tutorPromptCard = content.tutor_prompt_card || {};
      values.misconceptionDetector = content.misconception_detector || {};
      values.adaptiveHintPanel = content.adaptive_hint_panel || {};
      break;
  }

  if (existing) {
    await tx
      .update(table)
      .set(values)
      .where(eq(table.sectionId, sectionId));
  } else {
    await tx.insert(table).values(values);
  }
}

interface RequestBody {
  subtopicId: string;
  subtopicInfo: {
    domain: string;
    subject: string;
    topic: string;
    subtopic: string;
  };
  section: TutorialAdminSectionId;
  content: string | JsonRecord;
}

const TUTORIAL_CACHE_VERSIONS = ['v1', 'v2'] as const;
const TUTORIAL_DIFFICULTIES = ['simple'] as const;

const SECTION_TRANSFORMERS: Record<TutorialSectionId, (content: JsonRecord, subtopicName: string) => JsonRecord> = {
  overview: transformOverviewSection,
  notes: transformNotesSection,
  layman: transformLaymanSection,
  real_life: transformRealLifeSection,
  technical: transformTechnicalSection,
  code: transformCodeSection,
  visual: transformVisualSection,
  practice: transformPracticeSection,
  assignment: transformAssignmentSection,
  project: transformProjectSection,
  quiz: transformQuizSection,
  summary: transformSummarySection,
  interview: transformInterviewSection,
  ai_tutor: transformAiTutorSection,
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function normalizeSvgAsset(value: unknown) {
  if (!isRecord(value)) return undefined;

  const type = asString(value.type);
  const name = asString(value.name);
  const alt = asString(value.alt);
  const dataUri = asString(value.dataUri);

  if (type !== 'inline_svg' || !name || !alt || !dataUri) {
    return undefined;
  }

  return {
    type: 'inline_svg' as const,
    name,
    alt,
    width: asNumber(value.width, 800),
    height: asNumber(value.height, 600),
    dataUri,
    ...(asString(value.caption) ? { caption: asString(value.caption) } : {}),
  };
}

async function invalidateTutorialDeliveryCache(subtopicSlug: string) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!baseUrl || !token) {
    return;
  }

  const keys = TUTORIAL_CACHE_VERSIONS.flatMap((version) => [
    ...TUTORIAL_DIFFICULTIES.map((difficulty) => `tutorial:${version}:sections:${subtopicSlug}:${difficulty}`),
    `tutorial:${version}:paths`,
  ]);

  await Promise.all(
    keys.map(async (key) => {
      const url = `${baseUrl}/del/${encodeURIComponent(key)}`;
      try {
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
      } catch (error) {
        console.warn('[Content Manager API] Failed to invalidate tutorial cache key', { key, error });
      }
    })
  );
}

function unwrapSectionContent(content: JsonRecord, config: TutorialSectionContract): JsonRecord {
  const keys = Object.keys(content);
  const matchingRootKeys = config.rootKeys.filter((key) => Object.prototype.hasOwnProperty.call(content, key));

  if (matchingRootKeys.length > 1) {
    throw new SectionContentError(
      `JSON contains multiple root keys for section '${config.dbType}': ${matchingRootKeys.join(', ')}. Provide exactly one root key or the direct section payload.`
    );
  }

  if (matchingRootKeys.length === 1) {
    if (keys.length !== 1) {
      throw new SectionContentError(
        `JSON root must contain only '${matchingRootKeys[0]}' for section '${config.dbType}', or provide the direct section payload.`
      );
    }

    const value = content[matchingRootKeys[0]];
    if (!isRecord(value)) {
      throw new SectionContentError(`Root key '${matchingRootKeys[0]}' must contain a JSON object.`);
    }

    return value;
  }

  for (const key of config.rootKeys) {
    if (Object.prototype.hasOwnProperty.call(content, key)) {
      const value = content[key];
      if (isRecord(value) && (keys.length === 1 || config.dbType !== 'notes')) {
        return value;
      }
    }
  }
  return content;
}

class SectionContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SectionContentError';
  }
}

function toChecklist(items: unknown[]): Array<{ id: string; item: string; checked: boolean }> {
  return items.map((item, index) => ({
    id: `rc${index + 1}`,
    item: asString(item, `Review point ${index + 1}`),
    checked: false,
  }));
}

function transformOverviewSection(content: JsonRecord, subtopicName: string): JsonRecord {
  const hero = asRecord(content.hero);
  const progressSummary = asRecord(content.progressSummary);
  const learningRoadmap = asRecord(content.learningRoadmap);
  const readinessContext = asRecord(content.readinessContext);
  const navigation = asRecord(content.navigation);

  const checklist = asArray<JsonRecord>(progressSummary.checklist).map((item, index) => ({
    label: asString(item.label, `Step ${index + 1}`),
    completed: typeof item.completed === 'boolean' ? item.completed : false,
  }));

  const rawOutcomes = asArray(content.learningOutcomes).map((o) => asString(o)).filter(Boolean);
  const outcomes = rawOutcomes.length > 0 ? rawOutcomes : ['Understand the core concepts', 'Explore key use cases', 'Apply practical skills'];

  const rawPre = asArray(readinessContext.prerequisites).map((p) => asString(p)).filter(Boolean);
  const prerequisites = rawPre.length > 0 ? rawPre : ['Basic computer skills'];

  const rawSuccess = asArray(readinessContext.successCriteria).map((s) => asString(s)).filter(Boolean);
  const successCriteria = rawSuccess.length > 0 ? rawSuccess : ['Score 80% on the quiz', 'Submit assignments'];

  const rawFlow = asArray(content.recommendedFlow).map((f) => asString(f)).filter(Boolean);
  const recommendedFlow = rawFlow.length > 0 ? rawFlow : ['Learn basic syntax', 'Review code examples', 'Solve practice questions'];

  const defaultContentCardTypes = ['notes', 'layman', 'example', 'code', 'deep-dive', 'visual', 'task', 'practice', 'assignment', 'project', 'quiz'];

  const rawContentCards = asArray(learningRoadmap.contentCards ?? content.contentCards).map((card, idx) => {
    const c = asRecord(card);
    const rawType = asString(c.type, 'notes');
    const type = defaultContentCardTypes.includes(rawType) ? rawType : 'notes';
    return {
      id: asString(c.id, `cc${idx + 1}`),
      title: asString(c.title, `Topic ${idx + 1}`),
      type,
      content: asString(c.content, 'Review notes.'),
      ctaLabel: asString(c.ctaLabel, 'Start'),
      badge: c.badge ? {
        text: asString(asRecord(c.badge).text, 'Topic'),
        type: ['success', 'warning', 'info'].includes(asString(asRecord(c.badge).type))
          ? asString(asRecord(c.badge).type)
          : 'info',
      } : undefined,
    };
  });
  const contentCards = rawContentCards.length > 0 ? rawContentCards : [
    {
      id: 'cc1',
      title: 'Core Notes',
      type: 'notes',
      content: 'Get started with high-quality academic summaries.',
      ctaLabel: 'Read Notes',
    },
    {
      id: 'cc2',
      title: 'Layman Summary',
      type: 'layman',
      content: 'Learn through simple visual and everyday analogies.',
      ctaLabel: 'Read Layman',
    },
  ];

  const rawTaskCards = asArray(learningRoadmap.taskCards ?? content.taskCards).map((card, idx) => {
    const c = asRecord(card);
    const rawType = asString(c.type, 'task');
    const type = defaultContentCardTypes.includes(rawType) ? rawType : 'task';
    return {
      id: asString(c.id, `tc${idx + 1}`),
      title: asString(c.title, `Task ${idx + 1}`),
      type,
      content: asString(c.content, 'Complete task.'),
      ctaLabel: asString(c.ctaLabel, 'Go'),
      badge: c.badge ? {
        text: asString(asRecord(c.badge).text, 'Task'),
        type: ['success', 'warning', 'info'].includes(asString(asRecord(c.badge).type))
          ? asString(asRecord(c.badge).type)
          : 'info',
      } : undefined,
    };
  });
  const taskCards = rawTaskCards.length > 0 ? rawTaskCards : [
    {
      id: 'tc1',
      title: 'Practice Challenge',
      type: 'practice',
      content: 'Solve interactive multiple-choice questions.',
      ctaLabel: 'Start Practice',
    },
    {
      id: 'tc2',
      title: 'Interactive Quiz',
      type: 'quiz',
      content: 'Test your understanding with active feedback.',
      ctaLabel: 'Start Quiz',
    },
  ];

  return {
    schemaVersion: 1,
    sectionType: 'overview',
    hero: {
      iconLabel: asString(hero.iconLabel, 'LayoutDashboard'),
      title: asString(hero.title, subtopicName),
      description: asString(hero.description, asString(content.description, `Start learning ${subtopicName}.`)),
      difficulty: asString(hero.difficulty, 'Beginner'),
      estimatedReadTime: asString(hero.estimatedReadTime, '45 mins'),
      xp: asNumber(hero.xp, 500),
      topicsCount: asNumber(hero.topicsCount, 10),
      lastUpdated: asString(hero.lastUpdated, 'Today'),
    },
    progressSummary: {
      percentage: asNumber(progressSummary.percentage, 0),
      checklist: checklist.length > 0 ? checklist : [
        { label: 'Notes', completed: false },
        { label: 'Practice', completed: false },
        { label: 'Assignment', completed: false },
        { label: 'Quiz', completed: false },
      ],
    },
    learningOutcomes: outcomes,
    learningRoadmap: {
      contentCards,
      taskCards,
    },
    recommendedFlow,
    readinessContext: {
      prerequisites,
      successCriteria,
    },
    navigation: {
      prevTitle: asString(navigation.prevTitle, 'Previous Topic'),
      nextTitle: asString(navigation.nextTitle, 'Next Topic'),
    },
  };
}

function transformNotesSection(content: JsonRecord, subtopicName: string): JsonRecord {
  if (isRecord(content.definitionBlock)) {
    const definitionBlock = asRecord(content.definitionBlock);
    const componentGrid = asRecord(content.componentGrid);
    const examplePanel = asRecord(content.examplePanel);
    const practiceCard = asRecord(content.practiceCard);
    const warningFaq = asRecord(content.warningFaq);
    const summaryCard = asRecord(content.summaryCard);

    return {
      simpleWords: asString(content.simpleWords, asString(definitionBlock.definitionText, subtopicName)),
      summaryHeroInfographic: isRecord(content.summaryHeroInfographic) ? {
        ...asRecord(content.summaryHeroInfographic),
        ...(normalizeSvgAsset(asRecord(content.summaryHeroInfographic).image) ? { image: normalizeSvgAsset(asRecord(content.summaryHeroInfographic).image) } : {})
      } : undefined,
      conceptMemoryMap: isRecord(content.conceptMemoryMap) ? {
        ...asRecord(content.conceptMemoryMap),
        ...(normalizeSvgAsset(asRecord(content.conceptMemoryMap).image) ? { image: normalizeSvgAsset(asRecord(content.conceptMemoryMap).image) } : {})
      } : undefined,
      cheatSheetSVG: isRecord(content.cheatSheetSVG) ? {
        ...asRecord(content.cheatSheetSVG),
        ...(normalizeSvgAsset(asRecord(content.cheatSheetSVG).image) ? { image: normalizeSvgAsset(asRecord(content.cheatSheetSVG).image) } : {})
      } : undefined,
      definitionBlock: {
        ...definitionBlock,
        quickSummary: asArray(definitionBlock.quickSummary),
      },
      sections: asArray(content.sections),
      componentGrid: {
        ...componentGrid,
        componentCards: asArray(componentGrid.componentCards),
      },
      syntaxBlock: isRecord(content.syntaxBlock) ? {
        ...asRecord(content.syntaxBlock),
        ...(normalizeSvgAsset(asRecord(content.syntaxBlock).image) ? { image: normalizeSvgAsset(asRecord(content.syntaxBlock).image) } : {})
      } : undefined,
      examplePanel: {
        ...examplePanel,
        scenarios: asArray(examplePanel.scenarios),
      },
      practiceCard: {
        ...practiceCard,
        recommendations: asArray(practiceCard.recommendations),
        optimizationTips: asArray(practiceCard.optimizationTips),
        industryStandards: asArray(practiceCard.industryStandards),
      },
      warningFaq: {
        ...warningFaq,
        commonErrors: asArray(warningFaq.commonErrors),
        faqItems: asArray(warningFaq.faqItems),
        misconceptionAlerts: asArray(warningFaq.misconceptionAlerts),
      },
      summaryCard: {
        ...summaryCard,
        keyTakeaways: asArray(summaryCard.keyTakeaways),
        revisionChecklist: asArray(summaryCard.revisionChecklist),
        examTips: asArray(summaryCard.examTips),
        ...(normalizeSvgAsset(summaryCard.image) ? { image: normalizeSvgAsset(summaryCard.image) } : {}),
      },
      footerBlock: isRecord(content.footerBlock) ? asRecord(content.footerBlock) : undefined,
    };
  }

  const coreDefinition = asRecord(content.coreDefinition);
  const conceptExplanation = asRecord(content.conceptExplanation);
  const keyComponents = asRecord(content.keyComponents);
  const syntaxStructure = asRecord(content.syntaxStructure);
  const examples = asRecord(content.examples);
  const bestPractices = asRecord(content.bestPractices);
  const commonErrors = asRecord(content.commonErrors);
  const revisionSummary = asRecord(content.revisionSummary);

  const componentCards = asArray<JsonRecord>(keyComponents.components).map((component, index) => ({
    id: asString(component.id, `component-${index + 1}`),
    title: asString(component.name, `Component ${index + 1}`),
    description: asString(component.description),
    icon: asString(component.icon, 'Box'),
    subcomponents: [asString(component.purpose)].filter(Boolean),
  }));

  const syntaxScenario = Object.keys(syntaxStructure).length > 0
    ? [{
        id: 'syntax',
        title: asString(syntaxStructure.syntaxTitle, asString(syntaxStructure.title, 'Syntax')),
        scenarioDescription: asString(syntaxStructure.explanation),
        practicalSolution: asString(syntaxStructure.code),
        industryContext: 'Basic syntax pattern used in modern applications',
      }]
    : [];

  const exampleScenarios = asArray<JsonRecord>(examples.exampleCards).map((example, index) => ({
    id: asString(example.id, `example-${index + 1}`),
    title: asString(example.title, `Example ${index + 1}`),
    scenarioDescription: asString(example.scenario),
    practicalSolution: asString(example.code),
    industryContext: asString(example.explanation),
  }));

  return {
    simpleWords: asString(coreDefinition.simpleExplanation, `${subtopicName} explained simply`),
    definitionBlock: {
      badge: asString(coreDefinition.badge, 'Core Concept'),
      headline: asString(coreDefinition.headline, `What is ${subtopicName}?`),
      definitionText: asString(coreDefinition.definition),
      importanceCallout: asString(coreDefinition.whyItMatters),
      quickSummary: [asString(coreDefinition.simpleExplanation), asString(coreDefinition.keyTakeaway)].filter(Boolean),
    },
    sections: [{
      id: 'concept',
      title: asString(conceptExplanation.title, `Understanding ${subtopicName}`),
      content: [
        asString(conceptExplanation.introduction),
        asString(conceptExplanation.mainConcept),
        asString(conceptExplanation.detailedBreakdown),
      ].filter(Boolean).join('\n\n'),
      keyPoint: asString(conceptExplanation.visualAnalogy),
    }],
    componentGrid: {
      gridTitle: asString(keyComponents.title, `Key Components of ${subtopicName}`),
      componentCards,
    },
    examplePanel: {
      exampleTitle: asString(syntaxStructure.title, 'Practical Examples'),
      scenarios: [...syntaxScenario, ...exampleScenarios],
    },
    practiceCard: {
      bestPracticeTitle: asString(bestPractices.title, 'Best Practices'),
      recommendations: asArray<JsonRecord>(bestPractices.practices).map((practice, index) => ({
        id: asString(practice.id, `practice-${index + 1}`),
        title: asString(practice.title, `Practice ${index + 1}`),
        description: [
          asString(practice.description),
          asString(practice.doExample) ? `Do: ${asString(practice.doExample)}` : '',
          asString(practice.dontExample) ? `Avoid: ${asString(practice.dontExample)}` : '',
        ].filter(Boolean).join(' '),
      })),
      optimizationTips: ['Keep the implementation readable', 'Prefer consistent patterns across the project'],
      industryStandards: ['Use meaningful names', 'Document important tradeoffs'],
    },
    warningFaq: {
      commonErrors: asArray<JsonRecord>(commonErrors.errors).map((error, index) => ({
        id: asString(error.id, `error-${index + 1}`),
        error: asString(error.error),
        solution: [asString(error.why), asString(error.fix)].filter(Boolean).join(' '),
      })),
      faqItems: asArray(commonErrors.faqItems),
      misconceptionAlerts: ['Review common mistakes before applying this concept'],
    },
    summaryCard: {
      summaryTitle: asString(revisionSummary.title, 'Revision Summary'),
      keyTakeaways: asArray(revisionSummary.keyPoints),
      revisionChecklist: toChecklist(asArray(revisionSummary.quickRecap)),
      memoryReinforcement: asString(revisionSummary.rememberThis),
      examTips: asArray(revisionSummary.examTips),
      ...(normalizeSvgAsset(revisionSummary.image) ? { image: normalizeSvgAsset(revisionSummary.image) } : {}),
    },
  };
}

function transformLaymanSection(content: JsonRecord, subtopicName: string): JsonRecord {
  const simpleOverview = asRecord(content.simpleOverview);
  const everydayAnalogy = asRecord(content.everydayAnalogy);
  const whyItExists = asRecord(content.whyItExists);
  const simpleUseCases = asRecord(content.simpleUseCases);
  const beginnerBreakdown = asRecord(content.beginnerBreakdown);
  const mentalModel = asRecord(content.mentalModel);
  const commonConfusions = asRecord(content.commonConfusions);
  const simpleRecap = asRecord(content.simpleRecap);

  return {
    schemaVersion: 1,
    sectionType: 'layman',
    simpleOverview: {
      badge: asString(simpleOverview.badge, 'Layman Section'),
      headline: asString(simpleOverview.headline, `What is ${subtopicName}? in Simple Words`),
      simpleDefinition: asString(simpleOverview.simpleDefinition),
      subExplanation: asString(simpleOverview.subExplanation),
      importanceBlock: asString(simpleOverview.importanceBlock),
      progressIndicator: asString(simpleOverview.progressIndicator, 'Beginner-ready explanation.'),
      ...(normalizeSvgAsset(simpleOverview.heroVisual || simpleOverview.image) ? { heroVisual: normalizeSvgAsset(simpleOverview.heroVisual || simpleOverview.image) } : {}),
    },
    everydayAnalogy: Object.keys(everydayAnalogy).length > 0 ? {
      title: asString(everydayAnalogy.title, 'Everyday Analogy'),
      storyAnalogy: asString(everydayAnalogy.storyAnalogy),
      comparisonPanel: asString(everydayAnalogy.comparisonPanel),
      visualMetaphor: asArray<JsonRecord>(everydayAnalogy.visualMetaphor).map((item) => ({
        label: asString(item.label),
        comparison: asString(item.comparison),
      })),
      keyTakeaway: asString(everydayAnalogy.keyTakeaway),
      ...(normalizeSvgAsset(everydayAnalogy.image) ? { image: normalizeSvgAsset(everydayAnalogy.image) } : {}),
    } : undefined,
    whyItExists: Object.keys(whyItExists).length > 0 ? {
      sectionTitle: asString(whyItExists.sectionTitle, 'Why It Exists'),
      benefitCards: asArray<JsonRecord>(whyItExists.benefitCards).map((card) => ({
        id: asString(card.id),
        title: asString(card.title),
        description: asString(card.description),
        icon: asString(card.icon),
        type: asString(card.type, 'career') as 'career' | 'practical' | 'future',
      })),
    } : undefined,
    simpleUseCases: Object.keys(simpleUseCases).length > 0 ? {
      gridTitle: asString(simpleUseCases.gridTitle, 'Simple Use Cases'),
      useCaseCards: asArray<JsonRecord>(simpleUseCases.useCaseCards).map((card) => ({
        id: asString(card.id),
        title: asString(card.title),
        description: asString(card.description),
        category: asString(card.category, 'everyday') as 'everyday' | 'career',
        icon: asString(card.icon),
      })),
    } : undefined,
    beginnerBreakdown: Object.keys(beginnerBreakdown).length > 0 ? {
      title: asString(beginnerBreakdown.title, 'Beginner Breakdown'),
      steps: asArray<JsonRecord>(beginnerBreakdown.steps).map((step) => ({
        id: asString(step.id),
        stepTitle: asString(step.stepTitle),
        stepExplanation: asString(step.stepExplanation),
        microLearningChunk: asString(step.microLearningChunk),
      })),
    } : undefined,
    mentalModel: Object.keys(mentalModel).length > 0 ? {
      title: asString(mentalModel.title, 'Mental Model'),
      conceptMap: asArray<JsonRecord>(mentalModel.conceptMap).map((node) => ({
        id: asString(node.id),
        label: asString(node.label),
        type: asString(node.type),
      })),
      visualLabels: asArray<JsonRecord>(mentalModel.visualLabels).map((edge) => ({
        from: asString(edge.from),
        to: asString(edge.to),
        label: asString(edge.label),
      })),
      flowArrows: asArray<JsonRecord>(mentalModel.flowArrows).length > 0 ? asArray<JsonRecord>(mentalModel.flowArrows).map((arrow) => ({
        id: asString(arrow.id),
        label: asString(arrow.label),
        icon: asString(arrow.icon),
      })) : undefined,
      ...(normalizeSvgAsset(mentalModel.image) ? { image: normalizeSvgAsset(mentalModel.image) } : {}),
      tooltips: asString(mentalModel.tooltips) || undefined,
    } : undefined,
    commonConfusions: Object.keys(commonConfusions).length > 0 ? {
      title: asString(commonConfusions.title, 'Common Confusions'),
      confusionItems: asArray<JsonRecord>(commonConfusions.confusionItems).map((item) => ({
        id: asString(item.id),
        confusion: asString(item.confusion),
        clarification: asString(item.clarification),
      })),
      faqItems: asArray<JsonRecord>(commonConfusions.faqItems).map((item) => ({
        id: asString(item.id),
        question: asString(item.question),
        answer: asString(item.answer),
      })),
      misconceptionAlerts: asArray<string>(commonConfusions.misconceptionAlerts),
    } : undefined,
    simpleRecap: Object.keys(simpleRecap).length > 0 ? {
      summaryTitle: asString(simpleRecap.summaryTitle, 'Simple Recap'),
      keyTakeaways: asArray<string>(simpleRecap.keyTakeaways),
      simpleRecapPoints: asArray<JsonRecord>(simpleRecap.simpleRecapPoints).map((point) => ({
        id: asString(point.id),
        item: asString(point.item),
        checked: typeof point.checked === 'boolean' ? point.checked : false,
      })),
      confidenceBoost: asString(simpleRecap.confidenceBoost),
      memoryReinforcement: asString(simpleRecap.memoryReinforcement),
    } : undefined,
  } as unknown as JsonRecord;
}

function transformRealLifeSection(content: JsonRecord): JsonRecord {
  const careerRelevance = asRecord(content.careerRelevance);
  const domainScenarios = asRecord(content.domainScenarios);
  const practicalRecap = asRecord(content.practicalRecap);

  return {
    ...content,
    careerRelevance: {
      ...careerRelevance,
      careerPaths: asArray(careerRelevance.careerPaths),
    },
    domainScenarios: {
      ...domainScenarios,
      scenarios: asArray(domainScenarios.scenarios),
    },
    practicalRecap: {
      ...practicalRecap,
      keyApplications: asArray(practicalRecap.keyApplications),
      industryRelevance: asArray(practicalRecap.industryRelevance),
      nextSteps: asArray(practicalRecap.nextSteps),
    },
  };
}

function transformTechnicalSection(content: JsonRecord, subtopicName: string): JsonRecord {
  return {
    title: asString(content.title, `Technical Deep Dive: ${subtopicName}`),
    badge: asString(content.badge, 'Advanced'),
    intro: asString(content.intro),
    sections: asArray<JsonRecord>(content.sections).map((section) => ({
      ...section,
      steps: asArray(section.steps),
      keyPoints: asArray(section.keyPoints),
      ...(normalizeSvgAsset(section.diagramAsset) ? { diagramAsset: normalizeSvgAsset(section.diagramAsset) } : {}),
    })),
  };
}

function transformCodeSection(content: JsonRecord): JsonRecord {
  const problemContext = asRecord(content.problemContext);
  const lineByLineExplanation = asRecord(content.lineByLineExplanation);
  const outputDemonstration = asRecord(content.outputDemonstration);
  const bestPracticeVersion = asRecord(content.bestPracticeVersion);
  const commonMistakes = asRecord(content.commonMistakes);
  const realWorldImplementation = asRecord(content.realWorldImplementation);
  const codeSummary = asRecord(content.codeSummary);

  return {
    ...content,
    problemContext: {
      ...problemContext,
      requirements: asArray(problemContext.requirements),
    },
    lineByLineExplanation: {
      ...lineByLineExplanation,
      lines: asArray(lineByLineExplanation.lines),
    },
    outputDemonstration: {
      ...outputDemonstration,
      ...(normalizeSvgAsset(outputDemonstration.previewAsset) ? { previewAsset: normalizeSvgAsset(outputDemonstration.previewAsset) } : {}),
    },
    bestPracticeVersion: {
      ...bestPracticeVersion,
      improvements: asArray(bestPracticeVersion.improvements),
      benefits: asArray(bestPracticeVersion.benefits),
    },
    commonMistakes: {
      ...commonMistakes,
      mistakes: asArray(commonMistakes.mistakes),
    },
    realWorldImplementation: {
      ...realWorldImplementation,
      features: asArray(realWorldImplementation.features),
    },
    codeSummary: {
      ...codeSummary,
      keyTakeaways: asArray(codeSummary.keyTakeaways),
      nextSteps: asArray(codeSummary.nextSteps),
    },
  };
}

function transformVisualSection(content: JsonRecord): JsonRecord {
  const conceptVisualIntro = asRecord(content.conceptVisualIntro);
  const diagrammaticBreakdown = asRecord(content.diagrammaticBreakdown);
  const stepByStepVisualFlow = asRecord(content.stepByStepVisualFlow);
  const comparativeVisualization = asRecord(content.comparativeVisualization);
  const mentalModelVisualization = asRecord(content.mentalModelVisualization);
  const realWorldVisualMapping = asRecord(content.realWorldVisualMapping);
  const commonConfusionVisualization = asRecord(content.commonConfusionVisualization);
  const visualSummary = asRecord(content.visualSummary);

  return {
    ...content,
    conceptVisualIntro: {
      ...conceptVisualIntro,
      ...(normalizeSvgAsset(conceptVisualIntro.image) ? { image: normalizeSvgAsset(conceptVisualIntro.image) } : {}),
    },
    diagrammaticBreakdown: {
      ...diagrammaticBreakdown,
      componentLabels: asArray(diagrammaticBreakdown.componentLabels),
      stepMarkers: asArray(diagrammaticBreakdown.stepMarkers),
      technicalTooltips: asArray(diagrammaticBreakdown.technicalTooltips),
      ...(normalizeSvgAsset(diagrammaticBreakdown.image) ? { image: normalizeSvgAsset(diagrammaticBreakdown.image) } : {}),
    },
    stepByStepVisualFlow: {
      ...stepByStepVisualFlow,
      steps: asArray(stepByStepVisualFlow.steps),
      phaseExplanations: asArray(stepByStepVisualFlow.phaseExplanations),
      ...(normalizeSvgAsset(stepByStepVisualFlow.image) ? { image: normalizeSvgAsset(stepByStepVisualFlow.image) } : {}),
    },
    comparativeVisualization: {
      ...comparativeVisualization,
      differenceHighlights: asArray(comparativeVisualization.differenceHighlights),
      ...(normalizeSvgAsset(comparativeVisualization.image) ? { image: normalizeSvgAsset(comparativeVisualization.image) } : {}),
    },
    mentalModelVisualization: {
      ...mentalModelVisualization,
      nodes: asArray(asRecord(mentalModelVisualization.frameworkMap).nodes),
      connections: asArray(asRecord(mentalModelVisualization.frameworkMap).connections),
      ...(normalizeSvgAsset(mentalModelVisualization.image) ? { image: normalizeSvgAsset(mentalModelVisualization.image) } : {}),
    },
    realWorldVisualMapping: {
      ...realWorldVisualMapping,
      practicalScenarios: asArray(realWorldVisualMapping.practicalScenarios),
      ...(normalizeSvgAsset(realWorldVisualMapping.image) ? { image: normalizeSvgAsset(realWorldVisualMapping.image) } : {}),
    },
    commonConfusionVisualization: {
      ...commonConfusionVisualization,
      confusionItems: asArray(commonConfusionVisualization.confusionItems),
      faqItems: asArray(commonConfusionVisualization.faqItems),
      ...(normalizeSvgAsset(commonConfusionVisualization.image) ? { image: normalizeSvgAsset(commonConfusionVisualization.image) } : {}),
    },
    visualSummary: {
      ...visualSummary,
      keyVisualTakeaways: asArray(visualSummary.keyVisualTakeaways),
      examVisualChecklist: asArray(visualSummary.examVisualChecklist),
      ...(normalizeSvgAsset(visualSummary.image) ? { image: normalizeSvgAsset(visualSummary.image) } : {}),
    },
  };
}

function transformPracticeSection(content: JsonRecord): JsonRecord {
  if (isRecord(content.assessmentIntro) || isRecord(content.conceptRecallQuestions)) {
    const assessmentIntro = asRecord(content.assessmentIntro);
    const conceptRecallQuestions = asRecord(content.conceptRecallQuestions);
    const scenarioBasedQuestions = asRecord(content.scenarioBasedQuestions);

    return {
      ...content,
      assessmentIntro: {
        ...assessmentIntro,
        learningGoals: asArray(assessmentIntro.learningGoals),
      },
      conceptRecallQuestions: {
        ...conceptRecallQuestions,
        questions: asArray(conceptRecallQuestions.questions),
      },
      scenarioBasedQuestions: {
        ...scenarioBasedQuestions,
        scenarios: asArray(scenarioBasedQuestions.scenarios),
      },
    };
  }

  const theoryQuestions = asRecord(content.theoryQuestions);
  const practicalQuestions = asRecord(content.practicalQuestions);
  const recallQuestions = asArray<JsonRecord>(theoryQuestions.questions).map((question, index) => ({
    ...question,
    questionNumber: asNumber(question.questionNumber, index + 1),
    type: asString(question.type, 'single-choice'),
    points: asNumber(question.points, 2),
    options: asArray(question.options),
    difficulty: asString(question.difficulty, 'easy'),
  }));

  const scenarios = asArray<JsonRecord>(practicalQuestions.questions).map((question, index) => ({
    id: asString(question.id, `scenario-${index + 1}`),
    scenarioTitle: asString(question.scenario, `Scenario ${index + 1}`),
    realWorldProblem: asString(question.scenario),
    businessContext: 'Real-world application',
    decisionQuestion: asString(question.question),
    options: asArray(question.options),
    correctAnswer: asString(question.correctAnswer),
    explanation: asString(question.explanation),
    difficulty: asString(question.difficulty, 'medium'),
  }));

  return {
    assessmentIntro: {
      badge: 'Practice Test',
      headline: 'Final Knowledge Assessment',
      testDescription: 'Validate your understanding and practical application skills.',
      difficultyOverview: 'Mixed difficulty',
      learningGoals: ['Recall core ideas', 'Apply the concept', 'Avoid common mistakes'],
      readinessIndicator: 'Start when you have reviewed the notes and examples.',
    },
    conceptRecallQuestions: { questions: recallQuestions },
    scenarioBasedQuestions: { scenarios },
    instantFeedback: { enabled: true, feedbackType: 'immediate' },
  };
}

function transformAssignmentSection(content: JsonRecord): JsonRecord {
  const overview = asRecord(content.assignmentOverview);
  const taskRequirements = asRecord(content.taskRequirements);
  const task = asRecord(content.task);
  const starterCode = content.starterCode;

  return {
    title: asString(overview.title, asString(content.title, 'Assignment')),
    description: asString(overview.description, asString(content.description)),
    xp: asNumber(overview.xpReward, asNumber(content.xp, 150)),
    duration: asString(overview.estimatedTime, asString(content.duration, '20 Mins')),
    task: {
      title: asString(task.title, asString(taskRequirements.title, 'Assignment Task')),
      description: asString(task.description, asString(taskRequirements.description)),
      requirements: asArray<JsonRecord>(taskRequirements.requirements).map((item) =>
        [asString(item.requirement), asString(item.details)].filter(Boolean).join(': ')
      ).concat(asArray<string>(task.requirements)),
    },
    objectives: asArray(asRecord(content.learningObjectives).objectives).concat(asArray(content.objectives)),
    starterCode: typeof starterCode === 'string' ? starterCode : asString(asRecord(starterCode).code),
    submissionGuidelines: asArray(asRecord(content.submissionFeedback).guidelines)
      .concat(asArray(content.submissionGuidelines))
      .concat(asArray(content.guidelines)),
  };
}

function transformProjectSection(content: JsonRecord): JsonRecord {
  const overview = asRecord(content.projectOverview);
  const goals = asRecord(content.projectGoals);
  const technicalSpecifications = asRecord(content.technicalSpecifications);
  const implementationGuide = asRecord(content.implementationGuide);
  const featureRequirements = asRecord(content.featureRequirements);

  return {
    title: asString(overview.title, asString(content.title, 'Capstone Project')),
    description: asString(overview.description, asString(content.description)),
    xp: asNumber(overview.xpReward, asNumber(content.xp, 500)),
    deadline: asString(overview.estimatedTime, asString(content.deadline, '2 Days Left')),
    hero: content.hero ?? {
      badge: asString(overview.badge, 'project'),
      title: asString(overview.title, asString(content.title, 'Build a Project')),
      description: asString(overview.description, asString(goals.mainGoal, asString(content.description))),
      image: asString(content.image, '/project_mockup.svg'),
    },
    realWorldUse: asString(goals.realWorldRelevance, asString(content.realWorldUse, asString(content.applications))),
    skills: asArray(technicalSpecifications.technologies).concat(asArray(content.skills)),
    buildItems: asArray<JsonRecord>(implementationGuide.phases).map((phase) =>
      asString(phase.phase, asString(phase.title, asString(phase.description)))
    ).concat(
      asArray<JsonRecord>(featureRequirements.features).map((feature) =>
        asString(feature.feature, asString(feature.title, asString(feature.description)))
      )
    ).concat(asArray(content.buildItems)).concat(asArray(content.tasks)),
    deliverables: asArray(goals.learningOutcomes).concat(asArray(content.deliverables)),
  };
}

function transformQuizSection(content: JsonRecord): JsonRecord {
  const overview = asRecord(content.quizOverview);
  const questions = asArray<JsonRecord>(content.questions);
  const sectionGroups = ['multipleChoice', 'trueFalse', 'codeOutput', 'fillInBlank', 'codeDebugging', 'scenarioBased'];
  const groupedQuestions = sectionGroups.flatMap((groupName) => {
    const group = asRecord(content[groupName]);
    return asArray<JsonRecord>(group.questions);
  });
  const allQuestions = (questions.length > 0 ? questions : groupedQuestions).map((question, index) => ({
    ...question,
    id: asString(question.id, `q${index + 1}`),
    questionNumber: asNumber(question.questionNumber, index + 1),
    type: asString(question.type, 'Multiple Choice'),
    points: asNumber(question.points, 2),
    question: asString(question.question, asString(question.statement)),
    options: asArray(question.options),
    correctAnswer: typeof question.correctAnswer === 'boolean'
      ? String(question.correctAnswer)
      : asString(question.correctAnswer),
    explanation: asString(question.explanation),
  }));

  return {
    title: asString(overview.title, asString(content.title, 'Interactive Quiz')),
    description: asString(overview.description, asString(content.description)),
    totalQuestions: allQuestions.length,
    duration: asString(overview.timeLimit, asString(content.duration, '15 min')),
    xp: asNumber(overview.xpReward, asNumber(content.xp, 100)),
    questions: allQuestions,
  };
}

function transformSummarySection(content: JsonRecord, subtopicName: string): JsonRecord {
  return {
    title: asString(content.title, `${subtopicName} Summary`),
    description: asString(content.description, `Review the most important points about ${subtopicName}.`),
    masteryRecapCard: content.masteryRecapCard ?? content.mastery_recap_card ?? {},
    keyTakeawayGrid: asArray(content.keyTakeawayGrid ?? content.key_takeaway_grid),
    revisionChecklist: asArray(content.revisionChecklist ?? content.revision_checklist),
    nextStepPanel: content.nextStepPanel ?? content.next_step_panel ?? {},
  };
}

function transformInterviewSection(content: JsonRecord, subtopicName: string): JsonRecord {
  return {
    title: asString(content.title, `${subtopicName} Interview Prep`),
    description: asString(content.description, `Interview questions and answer patterns for ${subtopicName}.`),
    interviewIntroCard: content.interviewIntroCard ?? content.interview_intro_card ?? {},
    questionBankPanel: content.questionBankPanel ?? content.question_bank_panel ?? { questions: [] },
    answerFrameworkCard: content.answerFrameworkCard ?? content.answer_framework_card ?? {},
    mockInterviewFlow: content.mockInterviewFlow ?? content.mock_interview_flow ?? {},
  };
}

function transformAiTutorSection(content: JsonRecord, subtopicName: string): JsonRecord {
  return {
    greeting: asString(content.greeting, `Ask me anything about ${subtopicName}.`),
    qa_pairs: asArray(content.qa_pairs ?? content.qaPairs),
    tutor_prompt_card: content.tutor_prompt_card ?? content.tutorPromptCard ?? {},
    misconception_detector: content.misconception_detector ?? content.misconceptionDetector ?? {},
    adaptive_hint_panel: content.adaptive_hint_panel ?? content.adaptiveHintPanel ?? {},
  };
}

async function getOrCreateHierarchy(subtopicSlug: string, subtopicInfo: RequestBody['subtopicInfo']) {
  const domainSlug = slugify(subtopicInfo.domain);
  const subjectSlug = slugify(subtopicInfo.subject);
  const topicSlug = slugify(subtopicInfo.topic);

  let [domain] = await db
    .select()
    .from(tutorialDomains)
    .where(eq(tutorialDomains.slug, domainSlug))
    .limit(1);
  if (!domain) {
    [domain] = await db.insert(tutorialDomains).values({
      externalId: randomUUID(),
      name: subtopicInfo.domain,
      slug: domainSlug,
    }).returning();
  }

  let [subject] = await db
    .select()
    .from(tutorialSubjects)
    .where(eq(tutorialSubjects.slug, subjectSlug))
    .limit(1);
  if (!subject) {
    [subject] = await db.insert(tutorialSubjects).values({
      externalId: randomUUID(),
      domainId: domain.id,
      name: subtopicInfo.subject,
      slug: subjectSlug,
    }).returning();
  }

  let [topic] = await db
    .select()
    .from(tutorialTopics)
    .where(eq(tutorialTopics.slug, topicSlug))
    .limit(1);
  if (!topic) {
    [topic] = await db.insert(tutorialTopics).values({
      externalId: randomUUID(),
      subjectId: subject.id,
      name: subtopicInfo.topic,
      slug: topicSlug,
    }).returning();
  }

  let [subtopic] = await db
    .select()
    .from(tutorialSubtopics)
    .where(eq(tutorialSubtopics.slug, subtopicSlug))
    .limit(1);
  if (!subtopic) {
    [subtopic] = await db.insert(tutorialSubtopics).values({
      externalId: randomUUID(),
      topicId: topic.id,
      name: subtopicInfo.subtopic,
      slug: subtopicSlug,
      difficultyLevels: ['simple'],
    }).returning();
  }

  return subtopic;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subtopicSlug = searchParams.get('subtopicId');
    const sectionAdminId = searchParams.get('section');
    const subsection = searchParams.get('subsection');
    
    if (!subtopicSlug || !sectionAdminId) {
      return NextResponse.json({ error: 'Missing subtopicId or section' }, { status: 400 });
    }

    const config = getTutorialSectionContractByAdminId(sectionAdminId as TutorialAdminSectionId);
    if (!config) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 });
    }

    const [subtopic] = await db
      .select()
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.slug, subtopicSlug))
      .limit(1);

    if (!subtopic) {
      return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });
    }

    const [topic] = await db.select().from(tutorialTopics).where(eq(tutorialTopics.id, subtopic.topicId)).limit(1);
    const [subject] = topic ? await db.select().from(tutorialSubjects).where(eq(tutorialSubjects.id, topic.subjectId)).limit(1) : [null];
    const [domain] = subject ? await db.select().from(tutorialDomains).where(eq(tutorialDomains.id, subject.domainId)).limit(1) : [null];

    const subtopicInfo = {
      subtopicId: subtopic.slug,
      domain: domain?.name || '',
      subject: subject?.name || '',
      topic: topic?.name || '',
      subtopic: subtopic.name || '',
    };

    const [section] = await db
      .select()
      .from(tutorialSections)
      .where(and(
        eq(tutorialSections.subtopicId, subtopic.id),
        eq(tutorialSections.sectionType, config.dbType),
        eq(tutorialSections.difficulty, 'simple'),
        eq(tutorialSections.brandId, 'shared')
      ))
      .limit(1);

    if (!section) {
      return NextResponse.json({ content: null, subtopicInfo, message: 'Section not found' });
    }

    if (subsection) {
      const table = DOMAIN_TABLE_MAP[config.dbType];
      if (!table) {
        return NextResponse.json({ error: `Unsupported domain table for ${config.dbType}` }, { status: 400 });
      }

      const [domainRecord] = await db
        .select()
        .from(table)
        .where(eq(table.sectionId, section.id))
        .limit(1);

      if (!domainRecord) {
        return NextResponse.json({ content: null, subtopicInfo, message: 'Subsection not found in domain table' });
      }

      // Check if raw field matches or map column to camelCase
      const value = domainRecord[subsection];
      if (value === undefined) {
        return NextResponse.json({ error: `Subsection column '${subsection}' does not exist on table` }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        subtopicInfo,
        content: value,
      });
    }

    // Wrap it back in the root key for the editor
    const rootKey = config.rootKeys[0];
    const wrappedContent = { [rootKey]: section.content };

    return NextResponse.json({
      success: true,
      subtopicInfo,
      content: wrappedContent,
    });
  } catch (error: unknown) {
    console.error('[Content Manager API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function sanitizeRawContent(content: unknown): unknown {
  if (content === null || typeof content !== 'object') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(sanitizeRawContent);
  }

  const obj = { ...content } as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (
      key === 'image' ||
      key === 'heroVisual' ||
      key === 'analogySvg' ||
      key === 'mentalModelSvg' ||
      key === 'summaryHeroSvg' ||
      key === 'conceptMemoryMapSvg'
    ) {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (
          !trimmed.startsWith('<svg') &&
          !trimmed.startsWith('data:image/svg') &&
          !trimmed.startsWith('<?xml') &&
          !trimmed.includes('<svg')
        ) {
          obj[key] = undefined;
        }
      } else if (val && typeof val === 'object') {
        const isInlineSvg =
          (val as Record<string, unknown>).type === 'inline_svg' ||
          typeof (val as Record<string, unknown>).dataUri === 'string';
        if (!isInlineSvg) {
          obj[key] = undefined;
        }
      }
    } else {
      obj[key] = sanitizeRawContent(val);
    }
  }
  return obj;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody & { subsection?: string };
    const { subtopicId: subtopicSlug, subtopicInfo, section, subsection, content } = body;
    const config = getTutorialSectionContractByAdminId(section);

    if (!subtopicSlug || !subtopicInfo || !config || content === undefined) {
      return NextResponse.json({ error: 'Missing required fields or unsupported section' }, { status: 400 });
    }

    const subtopic = await getOrCreateHierarchy(subtopicSlug, subtopicInfo);
    const now = new Date();

    // Fetch or create the parent section record
    let [sectionRecord] = await db
      .select()
      .from(tutorialSections)
      .where(and(
        eq(tutorialSections.subtopicId, subtopic.id),
        eq(tutorialSections.sectionType, config.dbType),
        eq(tutorialSections.difficulty, 'simple'),
        eq(tutorialSections.brandId, 'shared')
      ))
      .limit(1);

    if (!sectionRecord && subsection) {
      // If updating a subsection but parent doesn't exist, create an empty parent first
      [sectionRecord] = await db.insert(tutorialSections).values({
        subtopicId: subtopic.id,
        sectionType: config.dbType,
        difficulty: 'simple',
        orderIndex: config.orderIndex,
        content: {},
        version: 1,
        language: 'en',
        status: 'approved',
        generatedByAi: true,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        publishedAt: now,
      }).returning();
    }

    if (subsection) {
      // SUBSECTION surgical update
      let processedContent: unknown;
      if (typeof content === 'string') {
        const trimmed = content.trim();
        if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg')) {
          // Automatic raw SVG serialization into InlineSvgAsset!
          processedContent = {
            type: 'inline_svg',
            name: `${config.dbType}-${subsection}-${subtopicSlug}-svg`,
            alt: `${config.dbType} ${subsection} diagram`,
            width: 1200,
            height: 700,
            dataUri: `data:image/svg+xml;base64,${Buffer.from(trimmed).toString('base64')}`,
          };
        } else {
          try {
            processedContent = JSON.parse(trimmed);
          } catch {
            // Treat as raw text
            processedContent = trimmed;
          }
        }
      } else {
        processedContent = content;
      }

      // 1. Resolve the child domain table and merge the parent JSON before any writes.
      const table = DOMAIN_TABLE_MAP[config.dbType];
      if (!table) {
        return NextResponse.json({ error: `Unsupported child domain table for section ${config.dbType}` }, { status: 400 });
      }

      const targetParentKey = COLUMN_TO_PARENT_KEY[subsection] || subsection;
      const updatedParentContent: Record<string, unknown> = {
        schemaVersion: 1,
        sectionType: config.dbType,
        ...(sectionRecord.content as Record<string, unknown>),
      };

      if (targetParentKey.includes('.')) {
        const [parentKey, childKey] = targetParentKey.split('.');
        updatedParentContent[parentKey] = {
          ...(updatedParentContent[parentKey] as Record<string, unknown>),
          [childKey]: processedContent,
        };
      } else {
        updatedParentContent[targetParentKey] = processedContent;
      }

      const sanitizedParentContent = sanitizeRawContent(updatedParentContent);
      const validation = validateTutorialSection(config.dbType, sanitizedParentContent);

      if (!validation.success) {
        const formattedIssues = formatTutorialSectionValidationIssues(validation.issues);
        console.error('[Content Manager API] Strict subsection validation failed', {
          subtopicSlug,
          sectionType: config.dbType,
          subsection,
          issues: validation.issues,
        });
        return NextResponse.json(
          {
            error: `Subsection '${subsection}' failed strict schema validation after parent merge. Regenerate or correct this subsection before saving.`,
            sectionType: config.dbType,
            subsection,
            issues: validation.issues satisfies TutorialSectionValidationIssue[],
            details: formattedIssues,
          },
          { status: 400 }
        );
      }

      // 2. Update the child domain table column after validation passes.
      const [existingChild] = await db
        .select()
        .from(table)
        .where(eq(table.sectionId, sectionRecord.id))
        .limit(1);

      if (existingChild) {
        await db
          .update(table)
          .set({
            [subsection]: processedContent,
            updatedAt: now,
          })
          .where(eq(table.sectionId, sectionRecord.id));
      } else {
        const defaults = DOMAIN_TABLE_DEFAULTS[config.dbType] || {};
        await db.insert(table).values({
          sectionId: sectionRecord.id,
          ...defaults,
          [subsection]: processedContent,
        });
      }

      // 3. Synchronize parent tutorialSections.content JSONB.
      await db
        .update(tutorialSections)
        .set({
          content: validation.data,
          updatedAt: now,
        })
        .where(eq(tutorialSections.id, sectionRecord.id));

      await invalidateTutorialDeliveryCache(subtopicSlug);

      return NextResponse.json({
        success: true,
        sectionType: config.dbType,
        subsection,
        message: `Subsection '${subsection}' of Section '${config.dbType}' saved successfully with complete parent parity.`,
        url: `/start-learning/subtopic/${subtopicSlug}?tab=${config.tab}`,
      });
    }




    if (!SECTION_TRANSFORMERS[config.dbType]) {
      return NextResponse.json({ error: `Unsupported section transformer for ${config.dbType}` }, { status: 400 });
    }

    let parsedContent: unknown;
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
      return NextResponse.json({ error: `Invalid JSON: ${errorMessage}` }, { status: 400 });
    }

    if (!isRecord(parsedContent)) {
      return NextResponse.json({ error: 'Section content must be a JSON object' }, { status: 400 });
    }


    const unwrappedContent = unwrapSectionContent(parsedContent, config);
    const sanitizedContent = sanitizeRawContent(unwrappedContent);
    const validation = validateTutorialSection(config.dbType, sanitizedContent);

    if (!validation.success) {
      const formattedIssues = formatTutorialSectionValidationIssues(validation.issues);
      console.error('[Content Manager API] Strict section validation failed', {
        subtopicSlug,
        sectionType: config.dbType,
        issues: validation.issues,
      });
      return NextResponse.json(
        {
          error: `Section '${config.dbType}' failed strict schema validation. Regenerate or correct this section before saving.`,
          sectionType: config.dbType,
          issues: validation.issues satisfies TutorialSectionValidationIssue[],
          details: formattedIssues,
        },
        { status: 400 }
      );
    }

    const transformedContent = validation.data;

    const [existingSection] = await db
      .select()
      .from(tutorialSections)
      .where(and(
        eq(tutorialSections.subtopicId, subtopic.id),
        eq(tutorialSections.sectionType, config.dbType),
        eq(tutorialSections.difficulty, 'simple'),
        eq(tutorialSections.brandId, 'shared')
      ))
      .limit(1);


    let savedSectionId = existingSection?.id;
    if (existingSection) {
      await db
        .update(tutorialSections)
        .set({
          content: transformedContent,
          orderIndex: config.orderIndex,
          status: 'approved',
          generatedByAi: true,
          updatedAt: now,
          publishedAt: now,
        })
        .where(eq(tutorialSections.id, existingSection.id));
    } else {
      const [newSec] = await db.insert(tutorialSections).values({
        subtopicId: subtopic.id,
        sectionType: config.dbType,
        difficulty: 'simple',
        orderIndex: config.orderIndex,
        content: transformedContent,
        version: 1,
        language: 'en',
        status: 'approved',
        generatedByAi: true,
        brandId: 'shared',
        brandVisibility: 'shared_visible',
        publishedAt: now,
      }).returning();
      savedSectionId = newSec.id;
    }

    await db.transaction(async (tx) => {
      await upsertChildDomainTable(tx, savedSectionId, config.dbType, transformedContent);
    });

    await invalidateTutorialDeliveryCache(subtopicSlug);

    return NextResponse.json({
      success: true,
      sectionType: config.dbType,
      message: `Section '${config.dbType}' saved to tutorial_sections successfully.`,
      url: `/start-learning/subtopic/${subtopicSlug}?tab=${config.tab}`,
    });
  } catch (error: unknown) {
    console.error('[Content Manager API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = error instanceof SectionContentError ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
