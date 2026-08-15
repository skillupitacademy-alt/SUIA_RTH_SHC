/**
 * Tutorial Rich Document - Presentation Zod Schemas
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

// Base schema without optional wrapper (for extending)
// IMPORTANT: .strict() prevents arbitrary CSS/className/style properties
const BasePresentationConfigSchema = z.object({
  width: BlockWidthSchema.optional(),
  alignment: BlockAlignmentSchema.optional(),
  spacing: BlockSpacingSchema.optional(),
  responsive: ResponsiveConfigSchema,
  emphasized: z.boolean().optional(),
  styleVariant: z.string().max(50).optional(),
}).strict();

// Export with optional wrapper
export const PresentationConfigSchema = BasePresentationConfigSchema.optional();

// Container schemas extend the base (without optional)
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
