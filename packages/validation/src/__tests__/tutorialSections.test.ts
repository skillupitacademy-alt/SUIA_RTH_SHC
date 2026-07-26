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
  concept_card: {
    heroTitle: 'What is a Python list?',
    heroSubtitle: 'A Python list stores multiple ordered values in one variable.',
    quickLook: ['Ordered', 'Mutable', 'Index based'],
  },
  definition_block: {
    badge: 'Core concept',
    headline: 'Python lists hold ordered collections',
    definition: 'A list is a mutable sequence of values.',
    simpleExplanation: 'Think of it like a numbered row of boxes.',
    whyItMatters: 'Lists are used to group values and process them together.',
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

  it('accepts canonical notes component keys that match renderer field names', () => {
    expect(validateTutorialSection('notes', validNotes).success).toBe(true);
  });

  it('accepts notes UI/UX contract beside canonical content', () => {
    const result = validateTutorialSection('notes', {
      ...validNotes,
      uiux_contract: {
        component_design_system: {
          concept_card: {
            layout: 'hero',
            density: 'compact',
            primary_color: '#d03f00',
            visible_parts: { action: false },
          },
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects legacy notes subsection aliases', () => {
    const result = validateTutorialSection('notes', {
      ...validNotes,
      definitionBlock: {
        term: 'Python list',
        definition: 'A sequence.',
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.some((issue) => issue.message.includes('Unrecognized key'))).toBe(true);
    }
  });

  it('rejects unknown keys in canonical notes visual blocks', () => {
    const result = validateTutorialSection('notes', {
      ...validNotes,
      concept_card: {
        ...validNotes.concept_card,
        rendererOnlyAlias: 'This must not be accepted silently.',
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.some((issue) => issue.path === 'concept_card')).toBe(true);
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
