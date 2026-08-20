/**
 * Tutorial AI Context Builder
 * 
 * Adapts existing Composer Selection to AI input context.
 * 
 * ARCHITECTURE:
 * - This is an ADAPTER, not a new hierarchy service
 * - Consumes existing CascadingSelect Selection interface
 * - Produces deterministic AI input context
 * - Does NOT modify source Selection
 * - Does NOT fetch from database
 * - Does NOT add system metadata (blockId, brandId, theme, etc.)
 * 
 * FLOW:
 * Existing Composer Selection
 *   → buildDefinitionD1AIContext()
 *   → DefinitionD1AIInputContext
 *   → AI receives context
 *   → AI returns { page: {...} }
 *   → Phase 1F validates output
 *   → Phase 1G wraps in canonical structure
 */

import type { DefinitionD1AIInputContext, CodeC1AIInputContext, TutorialAIHierarchyContext } from '@quiz/types';

/**
 * Composer Selection Interface (from CascadingSelect)
 * 
 * This is the existing interface from:
 * apps/skillhubcore-admin/src/components/entry/CascadingSelect.tsx
 * 
 * We import the shape but don't modify the original interface.
 */
export interface ComposerSelection {
  domainId: string | null;
  subjectId: string | null;
  topicId: string | null;
  subtopicId: string | null;
  skillIds: string[];
  // Extended metadata for UI
  domainName?: string;
  subjectName?: string;
  topicName?: string;
  subtopicName?: string;
}

/**
 * Build Definition D1 AI Input Context
 * 
 * Transforms Composer Selection → AI Input Context
 * 
 * VALIDATION:
 * - All hierarchy IDs must be present
 * - All hierarchy names must be present
 * - Throws explicit error if incomplete
 * 
 * ISOLATION:
 * - Does NOT include skillIds (not part of D1 contract)
 * - Does NOT include brandId (runtime resolution)
 * - Does NOT include theme (runtime resolution)
 * - Does NOT include blockId (system generates)
 * - Does NOT include schemaVersion (canonical layer)
 * 
 * @param selection - Existing Composer Selection from CascadingSelect
 * @returns Deterministic AI input context for Definition D1
 * @throws Error if hierarchy is incomplete or names are missing
 * 
 * @example
 * ```typescript
 * const selection = {
 *   domainId: 'domain-001',
 *   domainName: 'Full Stack Development',
 *   subjectId: 'subject-001',
 *   subjectName: 'Backend Development',
 *   topicId: 'topic-001',
 *   topicName: 'Python',
 *   subtopicId: 'subtopic-001',
 *   subtopicName: 'What Is a Variable?',
 *   skillIds: []
 * };
 * 
 * const context = buildDefinitionD1AIContext(selection);
 * // context.block.type === 'definition'
 * // context.block.version === 'D1'
 * // context.output.format === 'json'
 * // context.output.rootKey === 'page'
 * ```
 */
export function buildDefinitionD1AIContext(
  selection: ComposerSelection
): DefinitionD1AIInputContext {
  // Validate hierarchy IDs
  if (
    !selection.domainId ||
    !selection.subjectId ||
    !selection.topicId ||
    !selection.subtopicId
  ) {
    throw new Error(
      '[DefinitionD1AIContext] Complete hierarchy selection is required. ' +
      'Missing: ' +
      [
        !selection.domainId && 'domainId',
        !selection.subjectId && 'subjectId',
        !selection.topicId && 'topicId',
        !selection.subtopicId && 'subtopicId',
      ].filter(Boolean).join(', ')
    );
  }

  // Validate hierarchy names
  if (
    !selection.domainName ||
    !selection.subjectName ||
    !selection.topicName ||
    !selection.subtopicName
  ) {
    throw new Error(
      '[DefinitionD1AIContext] Complete hierarchy names are required. ' +
      'Missing: ' +
      [
        !selection.domainName && 'domainName',
        !selection.subjectName && 'subjectName',
        !selection.topicName && 'topicName',
        !selection.subtopicName && 'subtopicName',
      ].filter(Boolean).join(', ')
    );
  }

  // Build hierarchy context
  const hierarchyContext: TutorialAIHierarchyContext = {
    domainId: selection.domainId,
    domainName: selection.domainName,
    subjectId: selection.subjectId,
    subjectName: selection.subjectName,
    topicId: selection.topicId,
    topicName: selection.topicName,
    subtopicId: selection.subtopicId,
    subtopicName: selection.subtopicName,
  };

  // Return deterministic AI input context
  return {
    context: hierarchyContext,
    block: {
      type: 'definition',
      version: 'D1',
    },
    output: {
      format: 'json',
      rootKey: 'page',
    },
  };
}

/**
 * Build Code C1 AI Input Context
 * 
 * Transforms Composer Selection → AI Input Context
 * 
 * VALIDATION:
 * - All hierarchy IDs must be present
 * - All hierarchy names must be present
 * - Throws explicit error if incomplete
 * 
 * ISOLATION:
 * - Does NOT include skillIds (not part of C1 contract)
 * - Does NOT include brandId (runtime resolution)
 * - Does NOT include theme (runtime resolution)
 * - Does NOT include blockId (system generates)
 * - Does NOT include schemaVersion (canonical layer)
 * 
 * @param selection - Existing Composer Selection from CascadingSelect
 * @returns Deterministic AI input context for Code C1
 * @throws Error if hierarchy is incomplete or names are missing
 * 
 * @example
 * ```typescript
 * const selection = {
 *   domainId: 'domain-001',
 *   domainName: 'Full Stack Development',
 *   subjectId: 'subject-001',
 *   subjectName: 'Backend Development',
 *   topicId: 'topic-001',
 *   topicName: 'Python',
 *   subtopicId: 'subtopic-001',
 *   subtopicName: 'Hello World',
 *   skillIds: []
 * };
 * 
 * const context = buildCodeC1AIContext(selection);
 * // context.block.type === 'code'
 * // context.block.version === 'C1'
 * // context.output.format === 'json'
 * // context.output.rootKey === 'page'
 * ```
 */
export function buildCodeC1AIContext(
  selection: ComposerSelection
): CodeC1AIInputContext {
  // Validate hierarchy IDs
  if (
    !selection.domainId ||
    !selection.subjectId ||
    !selection.topicId ||
    !selection.subtopicId
  ) {
    throw new Error(
      '[CodeC1AIContext] Complete hierarchy selection is required. ' +
      'Missing: ' +
      [
        !selection.domainId && 'domainId',
        !selection.subjectId && 'subjectId',
        !selection.topicId && 'topicId',
        !selection.subtopicId && 'subtopicId',
      ].filter(Boolean).join(', ')
    );
  }

  // Validate hierarchy names
  if (
    !selection.domainName ||
    !selection.subjectName ||
    !selection.topicName ||
    !selection.subtopicName
  ) {
    throw new Error(
      '[CodeC1AIContext] Complete hierarchy names are required. ' +
      'Missing: ' +
      [
        !selection.domainName && 'domainName',
        !selection.subjectName && 'subjectName',
        !selection.topicName && 'topicName',
        !selection.subtopicName && 'subtopicName',
      ].filter(Boolean).join(', ')
    );
  }

  // Build hierarchy context
  const hierarchyContext: TutorialAIHierarchyContext = {
    domainId: selection.domainId,
    domainName: selection.domainName,
    subjectId: selection.subjectId,
    subjectName: selection.subjectName,
    topicId: selection.topicId,
    topicName: selection.topicName,
    subtopicId: selection.subtopicId,
    subtopicName: selection.subtopicName,
  };

  // Return deterministic AI input context
  return {
    context: hierarchyContext,
    block: {
      type: 'code',
      version: 'C1',
    },
    output: {
      format: 'json',
      rootKey: 'page',
    },
  };
}
