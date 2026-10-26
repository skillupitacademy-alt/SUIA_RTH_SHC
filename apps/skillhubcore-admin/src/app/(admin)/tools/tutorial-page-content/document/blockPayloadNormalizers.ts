import type {
  TutorialDefinitionPayload,
  TutorialIntroductionPayload,
} from '@quiz/types/tutorial-page-content.types';
import { definitionD1Example } from '../blocks/definition/D1/definitionD1.examples';
import { introductionI1Example } from '../blocks/introduction/I1/introductionI1.examples';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Builds a complete D1 payload for authoring previews without mutating source data.
 */
export function normalizeDefinitionD1Payload(payload: unknown): TutorialDefinitionPayload {
  const defaults = definitionD1Example.page;
  const rawPayload = isRecord(payload) ? payload : {};
  const rawPage = isRecord(rawPayload.page) ? rawPayload.page : rawPayload;
  const rawExample = isRecord(rawPage.example) ? rawPage.example : {};

  return {
    page: {
      type: stringOrFallback(rawPage.type, defaults.type),
      category: stringOrFallback(rawPage.category, defaults.category ?? 'Definition'),
      title: stringOrFallback(rawPage.title, defaults.title),
      intro: stringOrFallback(rawPage.intro, defaults.intro),
      definition: stringOrFallback(rawPage.definition, defaults.definition),
      explanation: Array.isArray(rawPage.explanation)
        ? rawPage.explanation.filter((item): item is string => typeof item === 'string')
        : [...defaults.explanation],
      example: {
        language: stringOrFallback(rawExample.language, defaults.example?.language ?? 'text'),
        code: stringOrFallback(rawExample.code, defaults.example?.code ?? ''),
      },
      characteristics: Array.isArray(rawPage.characteristics)
        ? rawPage.characteristics.filter(isRecord).map((item) => ({
            icon: typeof item.icon === 'string' ? item.icon : undefined,
            title: stringOrFallback(item.title, ''),
            description: stringOrFallback(item.description, ''),
          }))
        : defaults.characteristics?.map((item) => ({ ...item })) ?? [],
      takeaway: stringOrFallback(rawPage.takeaway, defaults.takeaway ?? ''),
    },
  };
}

/**
 * Builds a complete I1 payload for authoring previews without mutating source data.
 */
export function normalizeIntroductionI1Payload(payload: unknown): TutorialIntroductionPayload {
  const defaults = introductionI1Example.page;
  const rawPayload = isRecord(payload) ? payload : {};
  const rawPage = isRecord(rawPayload.page) ? rawPayload.page : rawPayload;
  const rawMotto = isRecord(rawPage.motto) ? rawPage.motto : {};
  const rawMottoLines = Array.isArray(rawMotto.lines) ? rawMotto.lines : [];
  const mottoLines = defaults.motto.lines.map((fallback, index) =>
    stringOrFallback(rawMottoLines[index], fallback)
  ) as [string, string, string, string];

  const rawTopic = isRecord(rawPage.topic) ? rawPage.topic : {};
  const rawWhereFit = isRecord(rawPage.whereFit) ? rawPage.whereFit : {};
  const rawSolution = isRecord(rawPage.solution) ? rawPage.solution : {};
  const rawCode = isRecord(rawSolution.code) ? rawSolution.code : {};
  const rawWhereUsed = isRecord(rawPage.whereUsed) ? rawPage.whereUsed : {};
  const rawRoadmap = isRecord(rawPage.roadmap) ? rawPage.roadmap : {};
  const rawWhyMatters = isRecord(rawPage.whyMatters) ? rawPage.whyMatters : {};

  return {
    page: {
      badge: stringOrFallback(rawPage.badge, defaults.badge),
      title: stringOrFallback(rawPage.title, defaults.title),
      subtitle: stringOrFallback(rawPage.subtitle, defaults.subtitle),
      motto: { lines: mottoLines },
      learningGoal: stringOrFallback(rawPage.learningGoal, defaults.learningGoal),
      topic: {
        title: stringOrFallback(rawTopic.title, defaults.topic.title),
        description: stringOrFallback(rawTopic.description, defaults.topic.description),
        quote: stringOrFallback(rawTopic.quote, defaults.topic.quote),
      },
      whereFit: {
        title: stringOrFallback(rawWhereFit.title, defaults.whereFit.title),
        description: stringOrFallback(rawWhereFit.description, defaults.whereFit.description),
        flowCards: Array.isArray(rawWhereFit.flowCards)
          ? rawWhereFit.flowCards.filter(isRecord).map((card) => ({
              title: stringOrFallback(card.title, ''),
              subtitle: stringOrFallback(card.subtitle, ''),
              icon: stringOrFallback(card.icon, 'box') as typeof defaults.whereFit.flowCards[number]['icon'],
              highlight: card.highlight === true ? true : undefined,
            }))
          : defaults.whereFit.flowCards.map((card) => ({ ...card })),
      },
      solution: {
        title: stringOrFallback(rawSolution.title, defaults.solution.title),
        description: stringOrFallback(rawSolution.description, defaults.solution.description),
        code: {
          language: stringOrFallback(rawCode.language, defaults.solution.code.language),
          code: stringOrFallback(rawCode.code, defaults.solution.code.code),
        },
      },
      whereUsed: {
        title: stringOrFallback(rawWhereUsed.title, defaults.whereUsed.title),
        description: stringOrFallback(rawWhereUsed.description, defaults.whereUsed.description),
        useCases: Array.isArray(rawWhereUsed.useCases)
          ? rawWhereUsed.useCases.filter(isRecord).map((useCase) => ({
              title: stringOrFallback(useCase.title, ''),
              description: stringOrFallback(useCase.description, ''),
              icon: stringOrFallback(useCase.icon, 'box') as typeof defaults.whereUsed.useCases[number]['icon'],
              highlight: useCase.highlight === true ? true : undefined,
            }))
          : defaults.whereUsed.useCases.map((useCase) => ({ ...useCase })),
      },
      roadmap: {
        title: stringOrFallback(rawRoadmap.title, defaults.roadmap.title),
        description: stringOrFallback(rawRoadmap.description, defaults.roadmap.description),
        steps: Array.isArray(rawRoadmap.steps)
          ? rawRoadmap.steps.filter(isRecord).map((step) => ({
              title: stringOrFallback(step.title, ''),
              subtitle: stringOrFallback(step.subtitle, ''),
            }))
          : defaults.roadmap.steps.map((step) => ({ ...step })),
      },
      whyMatters: {
        title: stringOrFallback(rawWhyMatters.title, defaults.whyMatters.title),
        benefits: Array.isArray(rawWhyMatters.benefits)
          ? rawWhyMatters.benefits.filter(isRecord).map((benefit) => ({
              title: stringOrFallback(benefit.title, ''),
              subtitle: stringOrFallback(benefit.subtitle, ''),
              icon: stringOrFallback(benefit.icon, 'box') as typeof defaults.whyMatters.benefits[number]['icon'],
            }))
          : defaults.whyMatters.benefits.map((benefit) => ({ ...benefit })),
      },
      keyTakeaway: stringOrFallback(rawPage.keyTakeaway, defaults.keyTakeaway),
    },
  };
}
