import { describe, expect, it } from 'vitest';

import { PromptService } from '../prompt-service';

describe('PromptService', () => {
  it('generates a content prompt with the canonical schema guidance', () => {
    const prompt = PromptService.generateContentPrompt({
      context: {
        domainName: 'Full Stack',
        subjectName: 'JavaScript',
        topicName: 'Async Programming',
        subtopicName: 'Promises',
      },
      difficulty: 'simple',
    });

    expect(prompt).toContain('ACT AS A SENIOR TUTORIAL CONTENT GENERATOR');
    expect(prompt).toContain('"ai_tutor"');
    expect(prompt).toContain('notes, layman, real_life, technical, code, and ai_tutor');
  });

  it('generates an assignment prompt with practice-only rules', () => {
    const prompt = PromptService.generateAssignmentPrompt({
      context: {
        domainName: 'Full Stack',
        subjectName: 'JavaScript',
        topicName: 'Async Programming',
        subtopicName: 'Promises',
      },
      difficulty: 'mixed',
    });

    expect(prompt).toContain('practice only');
    expect(prompt).toContain('reference_answer');
    expect(prompt).toContain('MCQ + short_answer');
  });
});
