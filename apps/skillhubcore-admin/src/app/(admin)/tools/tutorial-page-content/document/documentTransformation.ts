/**
 * Document Transformation Module
 * 
 * Pure conversion logic for transforming between TutorialBlock and BlockInstance representations.
 * 
 * PURE MODULE - No React dependencies, no side effects, no state mutations.
 */

import { CodeC1AuthorContentSchema } from '@quiz/types/tutorial-rich-document';
import type {
  TutorialBlock,
  DefinitionD1AuthorContent,
  CodeC1AuthorContent,
  IntroductionI1AuthorContent,
} from '@quiz/types/tutorial-rich-document';
import type {
  TutorialDefinitionPayload,
  TutorialCodePayload,
  TutorialSummaryPayload,
  TutorialIntroductionPayload,
  TutorialObjectivePayload,
  TutorialPageContentType,
} from '@quiz/types/tutorial-page-content.types';
import { toCanonicalCodeC1 } from '../blocks/code/C1/codeC1.converter';
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
 * This keeps a partially written definition draft from reaching the canonical
 * renderer with a missing `content.page` object.
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
 * I1 is a rich, nine-section component; incomplete editor/AI drafts are expected
 * while authoring and must not be passed directly to the strict renderer.
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

/**
 * BlockInstance represents an editable block in the composer UI state
 */
export interface BlockInstance {
  id: string;
  type: TutorialPageContentType;
  version: string;
  versionCode: string;
  title: string;
  payload: TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload | TutorialIntroductionPayload | TutorialObjectivePayload | CodeC1AuthorContent;
  payloadFormat: 'legacy' | 'canonical';
  sourceFormat: 'json' | 'markdown';
  sourceContent: string;
  expectedTimeSec?: number;
}

/**
 * Extracts a human-readable title from a block payload
 */
export function extractBlockTitle(payload: unknown, type: TutorialPageContentType): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic payload access requires any, type refinement tracked in backlog
  const p = payload as any;
  if (!p) return 'Untitled Block';
  if (p.page?.title) return p.page.title;
  if (p.title) return p.title;
  if (type === 'definition') return p.page?.intro || 'Concept Definition';
  if (type === 'code') return p.code?.language ? `${p.code.language} Example` : 'Code Example';
  if (type === 'summary') return 'Revision Summary';
  if (type === 'introduction') return p.page?.title || 'Introduction';
  if (type === 'objective') return p.title || 'Learning Objectives';
  return 'Block Instance';
}

/**
 * Converts TutorialBlock[] (database/API format) to BlockInstance[] (editor state format).
 * 
 * Hydrates the editor with existing tutorial_sections.content.blocks[]
 * Detects canonical C1 blocks and preserves their format.
 * 
 * @param blocks - Array of TutorialBlock from database
 * @returns Array of BlockInstance for editor state
 */
export function tutorialBlocksToInstances(
  blocks: TutorialBlock[]
): BlockInstance[] {
  return blocks.map((block) => {
    let payload: TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload | TutorialIntroductionPayload | TutorialObjectivePayload | CodeC1AuthorContent;
    let sourceContent: string;

    switch (block.type) {
      case 'definition':
        payload = block.content as unknown as TutorialDefinitionPayload;
        sourceContent = JSON.stringify(payload, null, 2);

        return {
          id: block.id,
          type: 'definition',
          version: 'v1',
          versionCode: ('version' in block && block.version) ? block.version : 'D1', // Preserve database version, fallback to D1 for legacy
          title: extractBlockTitle(payload, 'definition'),
          payload,
          payloadFormat: 'legacy', // Definition blocks use legacy format for now
          sourceFormat: 'json',
          sourceContent,
          expectedTimeSec: block.expectedTimeSec,
        };

      case 'code': {
        // Check if already canonical C1
        const isCanonicalC1 = CodeC1AuthorContentSchema.safeParse(block.content).success;
        
        let codePayload: TutorialCodePayload | CodeC1AuthorContent;
        if (isCanonicalC1) {
          // Already canonical - preserve as-is
          codePayload = block.content as CodeC1AuthorContent;
        } else {
          // Legacy format - keep as legacy payload
          codePayload = block.content as unknown as TutorialCodePayload;
        }
        
        sourceContent = JSON.stringify(codePayload, null, 2);

        return {
          id: block.id,
          type: 'code',
          version: 'v1',
          versionCode: ('version' in block && block.version) ? block.version : 'C1', // Preserve database version, fallback to C1 for legacy
          title: extractBlockTitle(codePayload, 'code'),
          payload: codePayload,
          payloadFormat: isCanonicalC1 ? 'canonical' : 'legacy', // Track format
          sourceFormat: 'json',
          sourceContent,
          expectedTimeSec: block.expectedTimeSec,
        };
      }

      case 'summary':
        payload = block.content as unknown as TutorialSummaryPayload;
        sourceContent = JSON.stringify(payload, null, 2);

        return {
          id: block.id,
          type: 'summary',
          version: 'v1',
          versionCode: 'S1', // Summary blocks don't have version field yet in type system
          title: extractBlockTitle(payload, 'summary'),
          payload,
          payloadFormat: 'legacy', // Summary blocks use legacy format for now
          sourceFormat: 'json',
          sourceContent,
          expectedTimeSec: block.expectedTimeSec,
        };

      case 'introduction':
        // Introduction blocks are now supported for editing
        payload = block.content as unknown as TutorialIntroductionPayload;
        sourceContent = JSON.stringify(payload, null, 2);

        return {
          id: block.id,
          type: 'introduction',
          version: 'v1',
          versionCode: ('version' in block && block.version) ? block.version : 'I1', // Preserve database version, fallback to I1
          title: extractBlockTitle(payload, 'introduction'),
          payload,
          payloadFormat: 'legacy', // Introduction blocks use legacy format (matches TutorialIntroductionPayload)
          sourceFormat: 'json',
          sourceContent,
          expectedTimeSec: block.expectedTimeSec,
        };

      case 'objective':
        payload = block.content as TutorialObjectivePayload;
        sourceContent = JSON.stringify(payload, null, 2);

        return {
          id: block.id,
          type: 'objective',
          version: 'v1',
          versionCode: ('version' in block && block.version) ? block.version : 'O1',
          title: extractBlockTitle(payload, 'objective'),
          payload,
          payloadFormat: 'canonical',
          sourceFormat: 'json',
          sourceContent,
          expectedTimeSec: block.expectedTimeSec,
        };

      default: {
        // Type narrowing: all other block types (heading, paragraph, etc.) are not yet supported
        // in the GUI. When they are added, extend this switch.
        throw new Error(
          `Unsupported block type for editor: ${(block as TutorialBlock).type}`
        );
      }
    }
  });
}

/**
 * Converts BlockInstance (editor state format) to TutorialBlock (database/API format).
 * 
 * Type-safe conversion that enforces discriminated union types for each block type and version.
 * Handles both legacy and canonical C1 formats.
 * 
 * Note: payload types are cast through `unknown` because the GUI's legacy
 * TutorialDefinitionPayload/TutorialCodePayload types have slightly looser
 * type constraints than the strict DefinitionD1AuthorContent types.
 * Runtime validation occurs at the API boundary via Zod.
 * 
 * @param instance - BlockInstance from editor state
 * @returns TutorialBlock for API/storage
 * @throws Error if unsupported block type or version
 */
export function toTutorialBlock(instance: BlockInstance): TutorialBlock {
  switch (instance.type) {
    case 'definition': {
      if (instance.versionCode === 'D1' || instance.versionCode === 'v1' || !instance.versionCode) {
        return {
          id: instance.id,
          type: 'definition',
          version: 'D1',
          content: normalizeDefinitionD1Payload(instance.payload) as unknown as DefinitionD1AuthorContent,
          expectedTimeSec: instance.expectedTimeSec,
        };
      }

      // D2 does not exist yet in the type system
      throw new Error(
        `Unsupported definition version: ${instance.versionCode}. Only D1 is currently supported.`
      );
    }

    case 'code': {
      if (instance.versionCode === 'C1' || instance.versionCode === 'v1' || !instance.versionCode) {
        // If already canonical, return directly
        if (instance.payloadFormat === 'canonical') {
          // Payload is already CodeC1AuthorContent shape
          return {
            id: instance.id,
            type: 'code',
            version: 'C1',
            content: instance.payload as CodeC1AuthorContent,
            expectedTimeSec: instance.expectedTimeSec,
          };
        }
        
        // Legacy format - convert to canonical
        const result = toCanonicalCodeC1(instance.payload);
        
        // Note: warning is NOT set here (would cause render-time state mutation)
        // Warnings are set in event handlers (handlePreviewCurrent, handleAddBlockInstance)

        return {
          id: instance.id,
          type: 'code',
          version: 'C1',
          content: result.content,
          expectedTimeSec: instance.expectedTimeSec,
        };
      }

      // C2 does not exist yet in the type system
      throw new Error(
        `Unsupported code version: ${instance.versionCode}. Only C1 is currently supported.`
      );
    }

    case 'summary': {
      if (instance.versionCode === 'S1' || instance.versionCode === 'v1' || !instance.versionCode) {
        // Summary block does NOT have a version field in the current type system
        // Transform legacy TutorialSummaryPayload to SummaryBlock content structure
        const summaryPayload = instance.payload as TutorialSummaryPayload;
        
        // Extract points from the legacy structure
        const points: string[] = [];
        
        // Add summary text points if they exist
        if (summaryPayload.summary) {
          summaryPayload.summary.forEach(item => {
            if (item.text) {
              points.push(item.text);
            }
          });
        }
        
        // Extract key points from revision table rows if they exist
        if (summaryPayload.revisionTable?.rows) {
          summaryPayload.revisionTable.rows.forEach((row) => {
            if (row.keyPoint?.title) {
              points.push(row.keyPoint.title);
            }
          });
        }
        
        return {
          id: instance.id,
          type: 'summary',
          version: 'S1',
          content: {
            title: summaryPayload.page?.title,
            points: points.length > 0 ? points : ['Summary content'],
          },
          expectedTimeSec: instance.expectedTimeSec,
        };
      }

      throw new Error(
        `Unsupported summary version: ${instance.versionCode}`
      );
    }

    case 'introduction': {
      if (instance.versionCode === 'I1' || instance.versionCode === 'v1' || !instance.versionCode) {
        const introPayload = normalizeIntroductionI1Payload(instance.payload);
        
        return {
          id: instance.id,
          type: 'introduction',
          version: 'I1',
          content: introPayload as unknown as IntroductionI1AuthorContent,
          expectedTimeSec: instance.expectedTimeSec,
        };
      }

      throw new Error(
        `Unsupported introduction version: ${instance.versionCode}. Only I1 is currently supported.`
      );
    }

    case 'objective': {
      const raw = instance.payload as any;
      const content = (raw?.page && typeof raw.page === 'object') ? { ...raw.page } : { ...raw };
      if ('expectedTimeSec' in content) delete content.expectedTimeSec;
      const version = instance.versionCode === 'O2' ? 'O2' : 'O1';
      return {
        id: instance.id,
        type: 'objective',
        version,
        content: content as TutorialObjectivePayload,
        expectedTimeSec: instance.expectedTimeSec ?? raw?.expectedTimeSec,
      } as TutorialBlock;
    }

    case 'custom' as any: {
      return {
        id: instance.id,
        type: instance.type as any,
        version: instance.versionCode || instance.version || 'O1',
        content: instance.payload as any,
        expectedTimeSec: instance.expectedTimeSec,
      } as TutorialBlock;
    }

    default: {
      const blockType = (instance as any).type;
      return {
        id: instance.id,
        type: blockType,
        version: instance.versionCode || instance.version || '1',
        content: instance.payload as any,
        expectedTimeSec: instance.expectedTimeSec,
      } as TutorialBlock;
    }
  }
}
