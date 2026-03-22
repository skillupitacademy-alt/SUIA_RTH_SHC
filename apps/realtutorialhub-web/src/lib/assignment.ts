import { z } from 'zod';

import { AssignmentService } from '@/server/assignment.service';

export const assignmentDifficultySchema = z.enum(['simple', 'mixed', 'intermediate', 'expert']);

export const assignmentStartSchema = z.object({
  difficulty: assignmentDifficultySchema,
});

export const assignmentCompleteSchema = z.object({
  difficulty: assignmentDifficultySchema,
});

export const assignmentHelpSchema = z.object({
  subtopicId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  question: z.string().min(1),
});

export const assignmentService = new AssignmentService();
