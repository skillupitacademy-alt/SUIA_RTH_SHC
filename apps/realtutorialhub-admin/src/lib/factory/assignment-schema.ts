import { z } from 'zod';

export const AssignmentSchema = z.object({
    assignments: z.array(
        z.object({
            question_type: z.enum(['mcq', 'short_answer', 'code', 'open_ended']),
            question: z.string().min(1),
            hints: z.array(z.string().min(1)).default([]),
            reference_answer: z.string().min(1),
        })
    ).min(1),
});

export type AssignmentSchemaType = z.infer<typeof AssignmentSchema>;
