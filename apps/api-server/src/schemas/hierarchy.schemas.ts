import { z } from 'zod';

const status = z.enum(['active', 'inactive', 'draft']).optional();
const uuid = z.string().uuid({ message: 'Invalid ID format' });

export const domainSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  status,
});
export type DomainInput = z.infer<typeof domainSchema>;

export const subjectSchema = z.object({
  domainId: uuid,
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  status,
});
export type SubjectInput = z.infer<typeof subjectSchema>;

export const topicSchema = z.object({
  subjectId: uuid,
  name: z.string().min(1),
  description: z.string().optional(),
  complexityLevel: z.number().int().min(1).optional(),
  weight: z.number().int().min(1).optional(),
  status,
});
export type TopicInput = z.infer<typeof topicSchema>;

export const subtopicSchema = z.object({
  topicId: uuid,
  name: z.string().min(1),
  description: z.string().optional(),
  depthLevel: z.number().int().min(1).optional(),
});
export type SubtopicInput = z.infer<typeof subtopicSchema>;

export const skillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['technical', 'cognitive', 'process']).optional(),
  mappingType: z.enum(['conceptual', 'technical', 'practical']).optional(),
  weight: z.number().int().min(1).optional(),
});
export type SkillInput = z.infer<typeof skillSchema>;
