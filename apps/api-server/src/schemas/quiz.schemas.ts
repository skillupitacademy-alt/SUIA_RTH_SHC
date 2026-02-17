import { z } from 'zod';

const uuid = z.string().uuid({ message: 'Invalid ID format' });

export const startQuizSchema = z.object({
  blueprintId: uuid.optional(),
  domainId: uuid.optional(),
  questionCount: z.number().int().min(5).max(50).optional(),
  subjectIds: z.array(uuid).max(20).optional(),
  topicIds: z.array(uuid).max(20).optional(),
  subtopicIds: z.array(uuid).max(20).optional(),
  topics: z.array(z.string().min(1)).max(20).optional(),
  difficulty: z.enum(['simple', 'intermediate', 'expert', 'mixed']).optional(),
});
export type StartQuizInput = z.infer<typeof startQuizSchema>;

export const answerSchema = z.object({
  examId: uuid,
  questionId: uuid,
  answer: z.string().min(1),
});
export type AnswerInput = z.infer<typeof answerSchema>;

export const submitSchema = z.object({
  examId: uuid,
});
export type SubmitInput = z.infer<typeof submitSchema>;
