/**
 * Presentation Schema (Test Mock)
 * 
 * Simplified version for testing objective-o1.schema.ts in isolation.
 * The actual schema is in packages/types/src/tutorial-rich-document/schemas/presentation.schema.ts
 */

import { z } from 'zod';

export const BlockWidthSchema = z.enum(['narrow', 'normal', 'wide', 'full']);

export const BlockAlignmentSchema = z.enum(['left', 'center', 'right', 'justify']);

export const BlockSpacingSchema = z.enum(['none', 'tight', 'normal', 'relaxed', 'loose']);

export const TwoColumnRatioSchema = z.enum(['50-50', '60-40', '40-60', '70-30', '30-70']);

export const GridColumnsSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const ResponsiveConfigSchema = z.object({
  mobile: z.object({
    columns: GridColumnsSchema.optional(),
    width: BlockWidthSchema.optional(),
  }).strict().optional(),
  tablet: z.object({
    columns: GridColumnsSchema.optional(),
    width: BlockWidthSchema.optional(),
  }).strict().optional(),
  desktop: z.object({
    columns: GridColumnsSchema.optional(),
    width: BlockWidthSchema.optional(),
  }).strict().optional(),
}).strict().optional();

const BasePresentationConfigSchema = z.object({
  width: BlockWidthSchema.optional(),
  alignment: BlockAlignmentSchema.optional(),
  spacing: BlockSpacingSchema.optional(),
  responsive: ResponsiveConfigSchema,
  emphasized: z.boolean().optional(),
  styleVariant: z.string().max(50).optional(),
}).strict();

export const PresentationConfigSchema = BasePresentationConfigSchema.optional();

const BaseContainerPresentationConfigSchema = BasePresentationConfigSchema.extend({
  gap: BlockSpacingSchema.optional(),
  stretch: z.boolean().optional(),
});

export const ContainerPresentationConfigSchema = BaseContainerPresentationConfigSchema.optional();

export const TwoColumnPresentationConfigSchema = BaseContainerPresentationConfigSchema.extend({
  ratio: TwoColumnRatioSchema.optional(),
}).optional();

export const GridPresentationConfigSchema = BaseContainerPresentationConfigSchema.extend({
  columns: GridColumnsSchema.optional(),
  equalHeight: z.boolean().optional(),
}).optional();
