/**
 * Tutorial Rich Document - Document Zod Schema
 */

import { z } from 'zod';
import {
  CURRENT_SCHEMA_VERSION,
  MAX_BLOCKS_PER_DOCUMENT,
  MAX_NESTING_DEPTH,
  MAX_TOTAL_DOCUMENT_NODES,
} from '../constants';
import { TutorialBlockSchema } from './blocks.schema';

const TutorialDocumentMetadataSchema = z.object({
  estimatedReadTime: z.number().int().positive().optional(),
  learningObjectives: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  prerequisites: z.array(z.string().min(1)).optional(),
  complexityScore: z.number().int().min(1).max(10).optional(),
  isInteractive: z.boolean().optional(),
  audience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  custom: z.record(z.unknown()).optional(),
}).optional();

function extractChildBlockArrays(block: Record<string, any>): unknown[][] {
  if (!block || typeof block !== 'object' || typeof block.content !== 'object' || !block.content) {
    return [];
  }
  switch (block.type) {
    case 'two-column': {
      const left = Array.isArray(block.content.left?.blocks) ? block.content.left.blocks : [];
      const right = Array.isArray(block.content.right?.blocks) ? block.content.right.blocks : [];
      return [left, right];
    }
    case 'three-column': {
      if (!Array.isArray(block.content.columns)) return [];
      return block.content.columns.map((col: any) => (Array.isArray(col?.blocks) ? col.blocks : []));
    }
    case 'card-grid': {
      if (!Array.isArray(block.content.cards)) return [];
      return block.content.cards.map((card: any) => (Array.isArray(card?.blocks) ? card.blocks : []));
    }
    case 'timeline': {
      if (!Array.isArray(block.content.items)) return [];
      return block.content.items.map((item: any) => (Array.isArray(item?.blocks) ? item.blocks : []));
    }
    default:
      return [];
  }
}

export const TutorialDocumentSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  blocks: z.array(TutorialBlockSchema).max(MAX_BLOCKS_PER_DOCUMENT),
  metadata: TutorialDocumentMetadataSchema,
}).superRefine((doc, ctx) => {
  const seenIds = new Set<string>();
  const activeAncestors = new Set<object>();
  let totalNodes = 0;
  let exceededNodesReported = false;
  let exceededDepthReported = false;

  function traverse(blocks: unknown[], depth: number, pathPrefix: (string | number)[]) {
    if (depth > MAX_NESTING_DEPTH) {
      if (!exceededDepthReported) {
        exceededDepthReported = true;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Nesting depth ${depth} exceeds maximum allowed depth of ${MAX_NESTING_DEPTH}`,
          path: pathPrefix,
        });
      }
      return;
    }

    for (let i = 0; i < blocks.length; i++) {
      const rawBlock = blocks[i];
      if (!rawBlock || typeof rawBlock !== 'object' || Array.isArray(rawBlock)) {
        continue;
      }

      totalNodes += 1;
      if (totalNodes > MAX_TOTAL_DOCUMENT_NODES) {
        if (!exceededNodesReported) {
          exceededNodesReported = true;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Total document nodes exceed maximum allowed budget of ${MAX_TOTAL_DOCUMENT_NODES}`,
            path: [...pathPrefix, i],
          });
        }
        return;
      }

      if (activeAncestors.has(rawBlock)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Circular block reference detected in document',
          path: [...pathPrefix, i],
        });
        continue;
      }

      const block = rawBlock as Record<string, any>;
      if (typeof block.id === 'string') {
        if (seenIds.has(block.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate block ID: ${block.id}`,
            path: [...pathPrefix, i, 'id'],
          });
        } else {
          seenIds.add(block.id);
        }
      }

      const childArrays = extractChildBlockArrays(block);
      if (childArrays.length > 0) {
        activeAncestors.add(rawBlock);
        try {
          for (let groupIdx = 0; groupIdx < childArrays.length; groupIdx++) {
            const childBlocks = childArrays[groupIdx];
            if (childBlocks.length > 0) {
              traverse(childBlocks, depth + 1, [...pathPrefix, i, 'content', groupIdx]);
            }
          }
        } finally {
          activeAncestors.delete(rawBlock);
        }
      }
    }
  }

  traverse(doc.blocks, 0, ['blocks']);
});

export type TutorialDocumentInput = z.input<typeof TutorialDocumentSchema>;
export type TutorialDocumentOutput = z.output<typeof TutorialDocumentSchema>;
