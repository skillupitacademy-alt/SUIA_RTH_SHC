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
} from '@quiz/types/tutorial-rich-document';
import type {
  TutorialDefinitionPayload,
  TutorialCodePayload,
  TutorialSummaryPayload,
  TutorialPageContentType,
} from '@quiz/types/tutorial-page-content.types';
import { toCanonicalCodeC1 } from '../blocks/code/C1/codeC1.converter';

/**
 * BlockInstance represents an editable block in the composer UI state
 */
export interface BlockInstance {
  id: string;
  type: TutorialPageContentType;
  version: string;
  versionCode: string;
  title: string;
  payload: TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload | CodeC1AuthorContent;
  payloadFormat: 'legacy' | 'canonical';
  sourceFormat: 'json' | 'markdown';
  sourceContent: string;
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
    let payload: TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload | CodeC1AuthorContent;
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
      if (instance.versionCode === 'D1') {
        return {
          id: instance.id,
          type: 'definition',
          version: 'D1',
          content: instance.payload as unknown as DefinitionD1AuthorContent,
        };
      }

      // D2 does not exist yet in the type system
      throw new Error(
        `Unsupported definition version: ${instance.versionCode}. Only D1 is currently supported.`
      );
    }

    case 'code': {
      if (instance.versionCode === 'C1') {
        // If already canonical, validate and return directly
        if (instance.payloadFormat === 'canonical') {
          const validation = CodeC1AuthorContentSchema.safeParse(instance.payload);
          
          if (!validation.success) {
            const errors = validation.error.errors
              .map(e => `${e.path.join('.')}: ${e.message}`)
              .join('; ');
            throw new Error(
              `BlockInstance marked canonical but validation failed: ${errors}`
            );
          }
          
          return {
            id: instance.id,
            type: 'code',
            version: 'C1',
            content: validation.data,
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
        };
      }

      // C2 does not exist yet in the type system
      throw new Error(
        `Unsupported code version: ${instance.versionCode}. Only C1 is currently supported.`
      );
    }

    case 'summary': {
      if (instance.versionCode === 'S1') {
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
          content: {
            title: summaryPayload.page?.title,
            points: points.length > 0 ? points : ['Summary content'],
          },
        };
      }

      throw new Error(
        `Unsupported summary version: ${instance.versionCode}`
      );
    }

    default: {
      const exhaustiveCheck: never = instance.type;
      throw new Error(
        `Unsupported tutorial block type: ${exhaustiveCheck}`
      );
    }
  }
}
