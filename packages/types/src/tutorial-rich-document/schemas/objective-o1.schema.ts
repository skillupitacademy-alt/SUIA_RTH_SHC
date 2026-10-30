import { z } from 'zod';

export const ObjectiveO1ItemSchema = z
  .object({
    id: z.union([z.string().min(1), z.number()]).optional(),
    text: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    verb: z.string().optional(),
    description: z.string().optional(),
    badge: z.string().optional(),
    category: z.string().optional(),
    icon: z.string().optional(),
  })
  .passthrough()
  .refine(
    (item) =>
      (typeof item.text === 'string' && item.text.trim().length > 0) ||
      (typeof item.title === 'string' && item.title.trim().length > 0),
    {
      message: "Objective item must have either 'title' or 'text' with non-empty value",
    }
  );

export const ObjectiveO1NoteSchema = z.union([
  z.string().min(1),
  z
    .object({
      title: z.string().optional(),
      text: z.string().min(1),
    })
    .passthrough(),
]);

export const ObjectiveO1ContentSchema = z
  .object({
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    titleHighlight: z.string().optional(),
    introduction: z.string().optional(),
    subtitle: z.string().optional(),
    objectives: z.array(ObjectiveO1ItemSchema).min(1),
    goals: z.array(z.union([z.string().min(1), ObjectiveO1ItemSchema])).optional(),
    note: ObjectiveO1NoteSchema.optional(),
  })
  .passthrough();

export const ObjectiveO1BlockSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: z.literal('objective'),
    version: z.literal('O1'),
    content: ObjectiveO1ContentSchema,
    presentation: z.any().optional(),
    expectedTimeSec: z.number().int().positive().optional(),
    progressRole: z
      .enum(['instructional', 'structural', 'assessment', 'media'])
      .default('instructional')
      .optional(),
  })
  .passthrough();

export function validateObjectiveO1Block(data: unknown) {
  return ObjectiveO1BlockSchema.parse(data);
}

export type ObjectiveO1Item = z.infer<typeof ObjectiveO1ItemSchema>;
export type ObjectiveO1Note = z.infer<typeof ObjectiveO1NoteSchema>;
export type ObjectiveO1Content = z.infer<typeof ObjectiveO1ContentSchema>;
export type ObjectiveO1Block = z.infer<typeof ObjectiveO1BlockSchema>;

export type ObjectiveO1ItemContract = ObjectiveO1Item;
export type ObjectiveO1NoteContract = ObjectiveO1Note;
export type ObjectiveO1ContentPayload = ObjectiveO1Content;
export type ObjectiveO1BlockContract = ObjectiveO1Block;
