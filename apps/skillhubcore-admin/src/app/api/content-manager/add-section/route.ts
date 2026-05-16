import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  tutorialDomains,
  tutorialSections,
  tutorialSubjects,
  tutorialSubtopics,
  tutorialTopics,
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

  return {
    title: asString(content.title, asString(hero.title, subtopicName)),
    description: asString(
      content.description,
      asString(hero.description, `Start learning ${subtopicName} with a guided roadmap, examples, practice, and assessment.`)
    ),
    hero: {
      iconLabel: asString(hero.iconLabel),
      title: asString(hero.title, subtopicName),
      description: asString(hero.description, asString(content.description)),
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
    learningOutcomes: asArray(content.learningOutcomes),
    learningRoadmap: {
      contentCards: asArray(learningRoadmap.contentCards ?? content.contentCards),
      taskCards: asArray(learningRoadmap.taskCards ?? content.taskCards),
    },
    recommendedFlow: asArray(content.recommendedFlow),
    readinessContext: {
      prerequisites: asArray(readinessContext.prerequisites),
      successCriteria: asArray(readinessContext.successCriteria),
    },
    sidebar: content.sidebar ?? {},
    navigation: {
      prevTitle: asString(navigation.prevTitle, 'Previous Topic'),
      nextTitle: asString(navigation.nextTitle, 'Next Topic'),
    },
    rightSidebar: content.rightSidebar ?? {},
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
      conceptMemoryMap: isRecord(content.conceptMemoryMap) ? asRecord(content.conceptMemoryMap) : undefined,
      cheatSheetSVG: isRecord(content.cheatSheetSVG) ? asRecord(content.cheatSheetSVG) : undefined,
      definitionBlock: {
        ...definitionBlock,
        quickSummary: asArray(definitionBlock.quickSummary),
      },
      sections: asArray(content.sections),
      componentGrid: {
        ...componentGrid,
        componentCards: asArray(componentGrid.componentCards),
      },
      syntaxBlock: isRecord(content.syntaxBlock) ? asRecord(content.syntaxBlock) : undefined,
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
  const footerBlock = asRecord(content.footerBlock);

  return {
    simpleOverview: {
      badge: asString(simpleOverview.badge, 'LAYMAN SECTION'),
      headline: asString(simpleOverview.headline, `What is ${subtopicName}?`),
      simpleDefinition: asString(simpleOverview.simpleDefinition, `${subtopicName} explained simply`),
      subExplanation: asString(simpleOverview.subExplanation),
      ...(normalizeSvgAsset(simpleOverview.image) ? { image: normalizeSvgAsset(simpleOverview.image) } : {}),
      inShort: asString(simpleOverview.inShort),
    },
    everydayAnalogy: {
      title: asString(everydayAnalogy.title, 'Everyday Analogy'),
      analogyTitle: asString(everydayAnalogy.analogyTitle),
      analogyExplanation: asString(everydayAnalogy.analogyExplanation),
      comparisonPoints: asArray(everydayAnalogy.comparisonPoints),
      analogyInsight: asString(everydayAnalogy.analogyInsight),
      ...(normalizeSvgAsset(everydayAnalogy.image) ? { image: normalizeSvgAsset(everydayAnalogy.image) } : {}),
    },
    whyItExists: {
      sectionTitle: asString(whyItExists.sectionTitle, 'Why It Exists'),
      benefitCards: asArray(whyItExists.benefitCards),
    },
    simpleUseCases: {
      gridTitle: asString(simpleUseCases.gridTitle, 'Simple Use Cases'),
      useCaseCards: asArray(simpleUseCases.useCaseCards),
    },
    beginnerBreakdown: {
      title: asString(beginnerBreakdown.title, 'Beginner Breakdown (How It Works)'),
      steps: asArray(beginnerBreakdown.steps),
    },
    mentalModel: {
      title: asString(mentalModel.title, 'Mental Model (Big Picture)'),
      nodes: asArray(mentalModel.nodes),
      connections: asArray(mentalModel.connections),
      toolsAndServices: asArray(mentalModel.toolsAndServices),
      footerNote: asString(mentalModel.footerNote),
    },
    commonConfusions: {
      title: asString(commonConfusions.title, 'Common Confusions'),
      faqItems: asArray(commonConfusions.faqItems),
    },
    simpleRecap: {
      title: asString(simpleRecap.title, 'Simple Recap'),
      keyTakeaways: asArray(simpleRecap.keyTakeaways),
      rememberThis: asRecord(simpleRecap.rememberThis),
    },
    footerBlock: {
      quote: asString(footerBlock.quote),
      finalNote: asString(footerBlock.finalNote),
    },
  };
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
    sections: asArray(content.sections),
  };
}

function transformCodeSection(content: JsonRecord): JsonRecord {
  const problemContext = asRecord(content.problemContext);
  const lineByLineExplanation = asRecord(content.lineByLineExplanation);
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
  const diagrammaticBreakdown = asRecord(content.diagrammaticBreakdown);
  const stepByStepVisualFlow = asRecord(content.stepByStepVisualFlow);
  const comparativeVisualization = asRecord(content.comparativeVisualization);
  const visualSummary = asRecord(content.visualSummary);

  return {
    ...content,
    diagrammaticBreakdown: {
      ...diagrammaticBreakdown,
      componentLabels: asArray(diagrammaticBreakdown.componentLabels),
      stepMarkers: asArray(diagrammaticBreakdown.stepMarkers),
      technicalTooltips: asArray(diagrammaticBreakdown.technicalTooltips),
    },
    stepByStepVisualFlow: {
      ...stepByStepVisualFlow,
      steps: asArray(stepByStepVisualFlow.steps),
      phaseExplanations: asArray(stepByStepVisualFlow.phaseExplanations),
    },
    comparativeVisualization: {
      ...comparativeVisualization,
      differenceHighlights: asArray(comparativeVisualization.differenceHighlights),
    },
    visualSummary: {
      ...visualSummary,
      keyVisualTakeaways: asArray(visualSummary.keyVisualTakeaways),
      examVisualChecklist: asArray(visualSummary.examVisualChecklist),
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
      return NextResponse.json({ content: null, message: 'Section not found' });
    }

    // Wrap it back in the root key for the editor
    const rootKey = config.rootKeys[0];
    const wrappedContent = { [rootKey]: section.content };

    return NextResponse.json({
      success: true,
      content: wrappedContent,
    });
  } catch (error: unknown) {
    console.error('[Content Manager API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody;
    const { subtopicId: subtopicSlug, subtopicInfo, section, content } = body;
    const config = getTutorialSectionContractByAdminId(section);

    if (!subtopicSlug || !subtopicInfo || !config || !content) {
      return NextResponse.json({ error: 'Missing required fields or unsupported section' }, { status: 400 });
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

    const subtopic = await getOrCreateHierarchy(subtopicSlug, subtopicInfo);
    const unwrappedContent = unwrapSectionContent(parsedContent, config);
    const validation = validateTutorialSection(config.dbType, unwrappedContent);

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

    const now = new Date();
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
      await db.insert(tutorialSections).values({
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
      });
    }

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
