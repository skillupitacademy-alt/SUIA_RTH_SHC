/**
 * Tutorial Rich Document - Container Block Schemas
 * Runtime validation for container blocks (blocks that can contain other blocks)
 */

import { z } from 'zod';
import { MAX_CARD_GRID_ITEMS, MAX_TIMELINE_ITEMS } from '../constants';
import { BlockIdSchema } from './content-blocks.schema';
import {
  TwoColumnPresentationConfigSchema,
  GridPresentationConfigSchema,
  ContainerPresentationConfigSchema,
} from './presentation.schema';

// Forward declaration for recursive block schema
// This will be properly defined in blocks.schema.ts
export type TutorialBlockSchemaType = z.ZodType<any>;

// Placeholder that will be replaced with actual recursive schema
export const TutorialBlockSchemaLazy: TutorialBlockSchemaType = z.lazy(() => z.any());

// ============================================================
// CONTAINER BLOCKS
// ============================================================

export const TwoColumnBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('two-column'),
  content: z.object({
    left: z.object({
      blocks: z.array(TutorialBlockSchemaLazy),
    }),
    right: z.object({
      blocks: z.array(TutorialBlockSchemaLazy),
    }),
  }),
  presentation: TwoColumnPresentationConfigSchema,
});

export const ThreeColumnBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('three-column'),
  content: z.object({
    columns: z.tuple([
      z.object({ blocks: z.array(TutorialBlockSchemaLazy) }),
      z.object({ blocks: z.array(TutorialBlockSchemaLazy) }),
      z.object({ blocks: z.array(TutorialBlockSchemaLazy) }),
    ]),
  }),
  presentation: GridPresentationConfigSchema,
});

const CardSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().max(200).optional(),
  blocks: z.array(TutorialBlockSchemaLazy),
});

export const CardGridBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('card-grid'),
  content: z.object({
    cards: z.array(CardSchema).min(1).max(MAX_CARD_GRID_ITEMS),
  }),
  presentation: GridPresentationConfigSchema,
});

const TimelineItemSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  date: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  blocks: z.array(TutorialBlockSchemaLazy).optional(),
});

export const TimelineBlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal('timeline'),
  content: z.object({
    items: z.array(TimelineItemSchema).min(1).max(MAX_TIMELINE_ITEMS),
    orientation: z.enum(['vertical', 'horizontal']).optional(),
  }),
  presentation: ContainerPresentationConfigSchema,
});

// Container block union
export const ContainerBlockSchema = z.discriminatedUnion('type', [
  TwoColumnBlockSchema,
  ThreeColumnBlockSchema,
  CardGridBlockSchema,
  TimelineBlockSchema,
]);
