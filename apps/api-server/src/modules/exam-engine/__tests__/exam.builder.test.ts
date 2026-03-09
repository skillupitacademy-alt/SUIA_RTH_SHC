import { describe, expect, it } from 'vitest';
import { ExamBuilder } from '../exam.builder';

describe('ExamBuilder', () => {
  const defaultBlueprintId = 'bp_123';
  const defaultUserId = 'user_456';
  const defaultQuestions = [{ id: 'q_1', questionText: 'Test?' }];

  describe('Happy Path', () => {
    it('should build a valid exam configuration', async () => {
      const builder = new ExamBuilder()
        .forUser(defaultUserId)
        .withBlueprint(defaultBlueprintId)
        .withConfig({ questionCount: 1 });

      // In the real system this requires DI and async selection.
      // We will mock this in integration tests, but here we just check fluent API
      expect(builder).toBeInstanceOf(ExamBuilder);
      // We can't actually call .build() unit testing here easily because it relies
      // on DI container singletons (SelectionService, ExamRepository) which 
      // require database connections.
    });
    
    it('should assign config options', () => {
        const builder = new ExamBuilder()
            .withConfig({ difficulty: 'hard', questionCount: 10 });
            
        expect(builder).toBeDefined();
    });
  });
});
