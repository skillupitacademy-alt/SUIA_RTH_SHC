import { describe, it, expect, vi } from 'vitest';
import { assignmentDifficultySchema, assignmentStartSchema, assignmentCompleteSchema, assignmentHelpSchema, assignmentService } from '../assignment';
import { AssignmentService } from '@/server/assignment.service';

vi.mock('@/server/assignment.service', () => ({
  AssignmentService: vi.fn(),
}));

describe('assignment', () => {
  it('validates assignmentDifficultySchema correctly', () => {
    expect(assignmentDifficultySchema.safeParse('simple').success).toBe(true);
    expect(assignmentDifficultySchema.safeParse('mixed').success).toBe(true);
    expect(assignmentDifficultySchema.safeParse('intermediate').success).toBe(true);
    expect(assignmentDifficultySchema.safeParse('expert').success).toBe(true);
    expect(assignmentDifficultySchema.safeParse('invalid').success).toBe(false);
  });

  it('validates assignmentStartSchema correctly', () => {
    expect(assignmentStartSchema.safeParse({ difficulty: 'simple' }).success).toBe(true);
    expect(assignmentStartSchema.safeParse({ difficulty: 'invalid' }).success).toBe(false);
    expect(assignmentStartSchema.safeParse({ }).success).toBe(false);
  });

  it('validates assignmentCompleteSchema correctly', () => {
    expect(assignmentCompleteSchema.safeParse({ difficulty: 'mixed' }).success).toBe(true);
    expect(assignmentCompleteSchema.safeParse({ difficulty: 'invalid' }).success).toBe(false);
    expect(assignmentCompleteSchema.safeParse({ }).success).toBe(false);
  });

  it('validates assignmentHelpSchema correctly', () => {
    const valid = {
      subtopicId: '123e4567-e89b-12d3-a456-426614174000',
      assignmentId: '123e4567-e89b-12d3-a456-426614174001',
      question: 'How do I solve this?',
    };
    expect(assignmentHelpSchema.safeParse(valid).success).toBe(true);
    
    expect(assignmentHelpSchema.safeParse({ ...valid, subtopicId: 'invalid-uuid' }).success).toBe(false);
    expect(assignmentHelpSchema.safeParse({ ...valid, question: '' }).success).toBe(false);
  });

  it('exports an instance of AssignmentService', () => {
    expect(assignmentService).toBeDefined();
    expect(AssignmentService).toHaveBeenCalled();
  });
});
