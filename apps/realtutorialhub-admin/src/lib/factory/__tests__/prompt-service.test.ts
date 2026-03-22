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

  it('generates an assignment prompt with tier counts when provided', () => {
    const prompt = PromptService.generateAssignmentPrompt({
      context: {
        domainName: 'Full Stack',
        subjectName: 'JavaScript',
        topicName: 'Async Programming',
        subtopicName: 'Promises',
      },
      difficulty: 'expert',
      tierCounts: {
        simple: 3,
        mixed: 6,
        intermediate: 8,
        expert: 12,
      },
      questionTypesByTier: {
        simple: ['mcq'],
        mixed: ['mcq', 'short_answer'],
        intermediate: ['mcq', 'short_answer', 'code'],
        expert: ['mcq', 'short_answer', 'code', 'open_ended'],
      },
      referenceAnswerGuidance: 'Keep answers concise.',
    });

    expect(prompt).toContain('ASSIGNMENT VOLUME');
    expect(prompt).toContain('Simple: 3 questions');
    expect(prompt).toContain('QUESTION TYPES PER TIER');
    expect(prompt).toContain('Keep answers concise.');
  });
});
