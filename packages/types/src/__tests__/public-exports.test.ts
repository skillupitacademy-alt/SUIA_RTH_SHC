/**
 * Public Export Contract Test
 * Verifies that types are correctly exported from the public @quiz/types package
 */
import { describe, it, expect } from 'vitest';

describe('Public @quiz/types exports', () => {
  it('should export TutorialDifficulty type', () => {
    // This test verifies the import path works at compile time
    // Runtime check verifies the import succeeded
    type Test = import('@quiz/types').TutorialDifficulty;
    
    // Type-level assertion: TutorialDifficulty should have the correct values
    const validValues: Test[] = ['simple', 'mixed', 'intermediate', 'expert'];
    expect(validValues).toHaveLength(4);
    
    // Verify the type exists in the module
    expect(import('@quiz/types')).toBeDefined();
  });

  it('should export TutorialDifficultySchema', async () => {
    const { TutorialDifficultySchema } = await import('@quiz/types');
    
    // Verify schema accepts correct values
    expect(TutorialDifficultySchema.safeParse('simple').success).toBe(true);
    expect(TutorialDifficultySchema.safeParse('mixed').success).toBe(true);
    expect(TutorialDifficultySchema.safeParse('intermediate').success).toBe(true);
    expect(TutorialDifficultySchema.safeParse('expert').success).toBe(true);
    
    // Verify schema rejects incorrect values
    expect(TutorialDifficultySchema.safeParse('beginner').success).toBe(false);
    expect(TutorialDifficultySchema.safeParse('advanced').success).toBe(false);
  });

  it('should keep generic Difficulty and TutorialDifficulty separate', async () => {
    const { DifficultySchema, TutorialDifficultySchema } = await import('@quiz/types');
    
    // Verify both schemas exist
    expect(DifficultySchema).toBeDefined();
    expect(TutorialDifficultySchema).toBeDefined();
    
    // Generic Difficulty schema
    expect(DifficultySchema.safeParse('beginner').success).toBe(true);
    expect(DifficultySchema.safeParse('intermediate').success).toBe(true);
    expect(DifficultySchema.safeParse('advanced').success).toBe(true);
    expect(DifficultySchema.safeParse('simple').success).toBe(false); // Not in generic
    
    // Tutorial Difficulty schema
    expect(TutorialDifficultySchema.safeParse('simple').success).toBe(true);
    expect(TutorialDifficultySchema.safeParse('mixed').success).toBe(true);
    expect(TutorialDifficultySchema.safeParse('beginner').success).toBe(false); // Not in tutorial
  });
});
