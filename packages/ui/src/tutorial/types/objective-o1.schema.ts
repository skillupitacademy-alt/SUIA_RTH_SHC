import { z } from 'zod';

export const ObjectiveO1ObjectiveSchema = z.object({
  id: z.string(),
  text: z.string(),
}).catchall(z.unknown());

export const ObjectiveO1ContentSchema = z.object({
  title: z.string().optional(),
  eyebrow: z.string().optional(),
  introduction: z.string().optional(),
  objectives: z.array(ObjectiveO1ObjectiveSchema),
}).catchall(z.unknown());

export const ObjectiveO1Schema = z.object({
  id: z.string(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1ContentSchema.optional(),
}).catchall(z.unknown());

export type ObjectiveO1Objective = z.infer<typeof ObjectiveO1ObjectiveSchema>;
export type ObjectiveO1Content = z.infer<typeof ObjectiveO1ContentSchema>;
export type ObjectiveO1BlockData = z.infer<typeof ObjectiveO1Schema>;
