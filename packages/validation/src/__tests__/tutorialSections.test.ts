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

const validNotes = {
  schemaVersion: 1,
  sectionType: 'notes',
  cheatSheetSVG: {
    title: 'Python List Cheat Sheet',
    sections: [
      {
        id: 'append',
        title: 'Append Item',
        code: 'items.append("new")',
        description: 'Adds one item to the end of the list.',
      },
    ],
  },
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

  it('accepts notes cheat sheet items that match renderer field names', () => {
    expect(validateTutorialSection('notes', validNotes).success).toBe(true);
  });

  it('rejects notes cheat sheet items with loose label/value aliases', () => {
    const result = validateTutorialSection('notes', {
      ...validNotes,
      cheatSheetSVG: {
        title: 'Python List Cheat Sheet',
        sections: [{ label: 'Append Item', value: 'items.append("new")' }],
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.some((issue) => issue.path.startsWith('cheatSheetSVG.sections.0'))).toBe(true);
    }
  });

  it('rejects unknown keys in optional notes visual blocks', () => {
    const result = validateTutorialSection('notes', {
      ...validNotes,
      cheatSheetSVG: {
        ...validNotes.cheatSheetSVG,
        rendererOnlyAlias: 'This must not be accepted silently.',
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.some((issue) => issue.path === 'cheatSheetSVG')).toBe(true);
    }
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
