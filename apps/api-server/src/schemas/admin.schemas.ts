import { z } from 'zod';

const uuid = z.string().uuid({ message: 'Invalid ID format' });
const statusEnum = z.enum(['active', 'inactive', 'draft']).optional();
const difficultyEnum = z.enum(['simple', 'intermediate', 'expert']).optional();
const mappingEnum = z.enum(['conceptual', 'technical', 'practical']).optional();

const optionSchema = z.union([
  z.string().min(1),
  z.object({
    id: z.string().optional(),
    text: z.string().min(1).optional(),
    isCorrect: z.boolean().optional(),
  }),
]);

export const questionSchema = z.object({
  topicId: uuid,
  subtopicId: uuid.optional(),
  skillId: uuid.optional(),
  skillIds: z.array(uuid).optional(),
  difficulty: difficultyEnum,
  type: z.string().optional(),
  mappingType: mappingEnum,
  questionText: z.string().min(1),
  options: z.array(optionSchema).min(1),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  codeSnippet: z.string().nullable().optional(),
  estimatedTime: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  skillWeight: z.number().int().positive().optional(),
  status: statusEnum,
});
export type QuestionInput = z.infer<typeof questionSchema>;

export const bulkQuestionSchema = z.object({
  topicId: uuid,
  subtopicId: uuid.optional(),
  skillId: uuid.optional(),
  skillIds: z.array(uuid).optional(),
  questions: z.array(questionSchema).min(1),
});
export type BulkQuestionInput = z.infer<typeof bulkQuestionSchema>;

export const blueprintSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  domains: z.array(uuid).optional(),
  subjects: z.array(uuid).optional(),
  topics: z.array(uuid).optional(),
  subtopics: z.array(uuid).optional(),
  questionIds: z.array(uuid).optional(),
  totalQuestions: z.number().int().min(1).optional(),
  timeLimit: z.number().int().min(1).optional(),
  difficultyDistribution: z
    .object({
      simple: z.number().int().min(0),
      intermediate: z.number().int().min(0),
      expert: z.number().int().min(0),
    })
    .partial()
    .optional(),
});
export type BlueprintInput = z.infer<typeof blueprintSchema>;

export const jobSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});
export type JobInput = z.infer<typeof jobSchema>;

export const updateUserSchema = z.object({
  roles: z.array(z.string()).optional(),
  password: z.string().min(1).optional(),
  isBlocked: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const idArraySchema = z.object({
  ids: z.array(uuid).min(1),
});
export type IdArrayInput = z.infer<typeof idArraySchema>;

export const publishSchema = z.object({
  id: uuid,
});
export type PublishInput = z.infer<typeof publishSchema>;

export const validateTopicSchema = z.object({
  topicId: uuid,
});
export type ValidateTopicInput = z.infer<typeof validateTopicSchema>;

export const jobActionSchema = z.object({
  queueName: z.string(),
  jobId: z.string(),
  action: z.enum(['retry', 'discard', 'promote']),
});
export type JobActionInput = z.infer<typeof jobActionSchema>;
