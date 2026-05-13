import { describe, expect, it } from 'vitest';
import { calculateTutorialProgress, parseTutorialSection, validateTutorialSection } from '../index';

const validQuiz = {
  schemaVersion: 1,
  sectionType: 'quiz',
  title: 'Quiz',
  description: 'Quiz description.',
  totalQuestions: 1,
  duration: '10 min',
  xp: 50,
  questions: [
    {
      id: 'q1',
      questionNumber: 1,
      type: 'Single Choice',
      points: 2,
      question: 'Question?',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
      correctAnswer: 'a',
      explanation: 'Because.',
    },
  ],
};

describe('strict tutorial section validation', () => {
  it('accepts valid strict section payloads', () => {
    expect(validateTutorialSection('quiz', validQuiz).success).toBe(true);
  });

  it('rejects missing renderer-needed arrays', () => {
    const result = validateTutorialSection('quiz', { ...validQuiz, questions: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.some((issue) => issue.path === 'questions')).toBe(true);
    }
  });

  it('rejects broad or legacy content without schema version', () => {
    const result = validateTutorialSection('quiz', { title: 'Quiz', questions: [] });
    expect(result.success).toBe(false);
  });

  it('throws structured parse errors', () => {
    expect(() => parseTutorialSection('quiz', { ...validQuiz, sectionType: 'notes' })).toThrow(
      'failed strict schema validation'
    );
  });
});

describe('tutorial progress engine', () => {
  it('calculates canonical 13-section completion percent', () => {
    const snapshot = calculateTutorialProgress({ completedSections: ['notes', 'layman'] });
    expect(snapshot.requiredCount).toBe(13);
    expect(snapshot.completedCount).toBe(2);
    expect(snapshot.completionPercent).toBe(15);
    expect(snapshot.status).toBe('in_progress');
  });

  it('is idempotent for duplicate completions', () => {
    const snapshot = calculateTutorialProgress({ completedSections: ['notes', 'notes', 'layman'] });
    expect(snapshot.completedSections).toEqual(['notes', 'layman']);
  });
});

