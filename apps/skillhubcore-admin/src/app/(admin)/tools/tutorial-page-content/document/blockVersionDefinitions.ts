import type { TutorialPageContentType } from '@quiz/types';
import { toCanonicalCodeC1 } from '../blocks/code/C1/codeC1.converter';
import {
  normalizeDefinitionD1Payload,
  normalizeIntroductionI1Payload,
} from './documentTransformation';
import { GENERATED_BLOCK_VERSION_DEFINITIONS } from './generatedBlockVersionDefinitions';

export interface PreviewNormalizationResult {
  content: unknown;
  memoryModelWarning: string;
}

export interface StoragePreparationResult {
  content: unknown;
  payloadFormat: 'legacy' | 'canonical';
  memoryModelWarning: string;
}

export interface BlockVersionDefinition {
  type: TutorialPageContentType;
  version: string;
  normalizePreview: (payload: unknown) => PreviewNormalizationResult;
  prepareForStorage: (payload: unknown) => StoragePreparationResult;
  parseMarkdown?: (source: string) => unknown;
}

const identityPreview = (payload: unknown): PreviewNormalizationResult => ({
  content: payload,
  memoryModelWarning: '',
});

const legacyStorage = (payload: unknown): StoragePreparationResult => ({
  content: payload,
  payloadFormat: 'legacy',
  memoryModelWarning: '',
});

function normalizeCodeC1Preview(payload: unknown): PreviewNormalizationResult {
  try {
    const result = toCanonicalCodeC1(payload);
    return {
      content: result.content,
      memoryModelWarning: result.memoryModelWarning || '',
    };
  } catch (error) {
    console.error('[C1 Normalization] Failed to convert to canonical:', error);
    return identityPreview(payload);
  }
}

function prepareCodeC1Storage(payload: unknown): StoragePreparationResult {
  const result = toCanonicalCodeC1(payload);
  return {
    content: result.content,
    payloadFormat: 'canonical',
    memoryModelWarning: result.memoryModelWarning || '',
  };
}

function normalizeObjectivePreview(payload: unknown): PreviewNormalizationResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return identityPreview(payload);
  }

  const raw = payload as Record<string, unknown>;
  const content = raw.page && typeof raw.page === 'object' && !Array.isArray(raw.page)
    ? { ...(raw.page as Record<string, unknown>) }
    : { ...raw };
  delete content.expectedTimeSec;
  return identityPreview(content);
}

function parseDefinitionMarkdown(source: string): unknown {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    page: {
      type: 'definition',
      title: lines[0]?.replace(/^#\s*/, '') || 'Untitled Definition',
      intro: lines[1] || '',
      definition: lines[2] || '',
      explanation: lines.slice(3),
    },
  };
}

function parseSummaryMarkdown(source: string): unknown {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    page: {
      badge: 'REVISION & SUMMARY',
      title: lines[0]?.replace(/^#\s*/, '') || 'Revision Summary',
      introduction: lines[1] || '',
    },
    summary: lines.slice(2).map((line) => ({ text: line.replace(/^[-*]\s*/, '') })),
  };
}

function parseIntroductionMarkdown(source: string): unknown {
  const lines = source.split(/\r?\n/).map((line) => line.trim());
  const nonEmptyLines = lines.filter(Boolean);
  const badgeAndMotto = nonEmptyLines[2]?.split('|').map((item) => item.trim())
    || ['Topic', 'Start', 'Your', 'Learning', 'Journey'];

  return normalizeIntroductionI1Payload({
    page: {
      badge: badgeAndMotto[0] || 'Topic',
      title: nonEmptyLines[0]?.replace(/^#\s*/, '') || 'Untitled Introduction',
      subtitle: nonEmptyLines[1] || 'Learn the fundamentals',
      motto: {
        lines: [
          badgeAndMotto[1] || 'Start',
          badgeAndMotto[2] || 'Your',
          badgeAndMotto[3] || 'Learning',
          badgeAndMotto[4] || 'Journey',
        ],
      },
      learningGoal: nonEmptyLines[3] || 'Master the core concepts and practical applications.',
      topic: { description: nonEmptyLines[4] || 'Core concept explained.' },
    },
  });
}

function parseCodeMarkdown(source: string): unknown {
  const codeMatch = source.match(/```(\w+)?\n([\s\S]*?)```/);
  return {
    page: {
      type: 'CODE + EXPLANATION',
      title: source.split(/\r?\n/)[0]?.replace(/^#\s*/, '') || 'Untitled Code Example',
      introduction: 'Code example imported from markdown.',
    },
    code: {
      language: codeMatch?.[1] || 'text',
      prismLanguage: codeMatch?.[1] || 'text',
      source: codeMatch?.[2]?.trim() || source,
    },
  };
}

const definitions: BlockVersionDefinition[] = [
  {
    type: 'definition', version: 'D1',
    normalizePreview: (payload) => ({ content: normalizeDefinitionD1Payload(payload), memoryModelWarning: '' }),
    prepareForStorage: (payload) => ({ content: normalizeDefinitionD1Payload(payload), payloadFormat: 'legacy', memoryModelWarning: '' }),
    parseMarkdown: parseDefinitionMarkdown,
  },
  { type: 'code', version: 'C1', normalizePreview: normalizeCodeC1Preview, prepareForStorage: prepareCodeC1Storage, parseMarkdown: parseCodeMarkdown },
  { type: 'summary', version: 'S1', normalizePreview: identityPreview, prepareForStorage: legacyStorage, parseMarkdown: parseSummaryMarkdown },
  {
    type: 'introduction', version: 'I1',
    normalizePreview: (payload) => ({ content: normalizeIntroductionI1Payload(payload), memoryModelWarning: '' }),
    prepareForStorage: (payload) => ({ content: normalizeIntroductionI1Payload(payload), payloadFormat: 'legacy', memoryModelWarning: '' }),
    parseMarkdown: parseIntroductionMarkdown,
  },
  {
    type: 'objective', version: 'O1',
    normalizePreview: normalizeObjectivePreview,
    prepareForStorage: (payload) => ({ ...normalizeObjectivePreview(payload), payloadFormat: 'canonical' }),
  },
  {
    type: 'objective', version: 'O2',
    normalizePreview: normalizeObjectivePreview,
    prepareForStorage: (payload) => ({ ...normalizeObjectivePreview(payload), payloadFormat: 'canonical' }),
  },
  ...GENERATED_BLOCK_VERSION_DEFINITIONS.map((definition) => ({
    type: definition.type,
    version: definition.version,
    normalizePreview: identityPreview,
    prepareForStorage: (payload: unknown) => ({
      content: payload,
      payloadFormat: definition.payloadFormat,
      memoryModelWarning: '',
    }),
  })),
];

const defaultVersionByType: Record<TutorialPageContentType, string> = {
  definition: 'D1',
  code: 'C1',
  summary: 'S1',
  introduction: 'I1',
  objective: 'O1',
};

export function getBlockVersionDefinition(type: TutorialPageContentType, version: string): BlockVersionDefinition | undefined {
  const effectiveVersion = version === 'v1' || !version ? defaultVersionByType[type] : version;
  return definitions.find((definition) => definition.type === type && definition.version === effectiveVersion);
}

export function normalizeBlockPreviewPayload(payload: unknown, type: TutorialPageContentType, version: string): PreviewNormalizationResult {
  return getBlockVersionDefinition(type, version)?.normalizePreview(payload) ?? identityPreview(payload);
}

export function prepareBlockForStorage(payload: unknown, type: TutorialPageContentType, version: string): StoragePreparationResult {
  return getBlockVersionDefinition(type, version)?.prepareForStorage(payload) ?? legacyStorage(payload);
}

export function parseBlockMarkdown(source: string, type: TutorialPageContentType, version = ''): unknown {
  const definition = getBlockVersionDefinition(type, version);
  if (!definition?.parseMarkdown) {
    const effectiveVersion = version || defaultVersionByType[type];
    throw new Error(`Markdown authoring is not available for ${type} ${effectiveVersion}; use JSON authoring instead.`);
  }
  return definition.parseMarkdown(source);
}

export function getRegisteredBlockVersionDefinitions(): readonly BlockVersionDefinition[] {
  return definitions;
}
