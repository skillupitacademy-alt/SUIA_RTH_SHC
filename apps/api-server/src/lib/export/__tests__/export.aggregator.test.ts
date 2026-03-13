import { describe, it, expect } from 'vitest';
import { ExportAggregator } from '../exportAggregator';
import type { RawAttemptRow } from '../exportTypes';

const makeRow = (overrides: Partial<RawAttemptRow> = {}): RawAttemptRow => ({
  studentId: 's1',
  studentName: 'Student',
  studentEmail: 's1@example.com',
  sessionId: 'sess-1',
  sessionDate: '2024-01-01',
  vectorId: 'VECT1234',
  domain: 'Domain',
  subject: 'Subject',
  topic: 'Topic',
  subtopic: 'Subtopic',
  questionId: 'q1',
  questionText: 'Q',
  correctAnswer: 'A',
  userAnswer: 'A',
  isCorrect: true,
  difficulty: 'simple',
  timeSpentSeconds: 20,
  thresholdSeconds: 35,
  skillName: 'Skill',
  skillCategory: null,
  processingPattern: 'stable',
  isImpulsive: false,
  isDiligent: true,
  masteryWeight: 1,
  weightedScore: 1,
  ...overrides,
});

describe('ExportAggregator guidance signals', () => {
  it('adds historical regression and trend arrays', () => {
    const aggregator = new ExportAggregator();

    const historicalRows: RawAttemptRow[] = [
      makeRow({ sessionId: 'sess-1', sessionDate: '2024-01-01', isCorrect: true }),
      makeRow({ sessionId: 'sess-1', sessionDate: '2024-01-01', isCorrect: true }),
      makeRow({ sessionId: 'sess-2', sessionDate: '2024-02-01', isCorrect: true }),
      makeRow({ sessionId: 'sess-2', sessionDate: '2024-02-01', isCorrect: false }),
    ];

    const currentRows: RawAttemptRow[] = [
      makeRow({ isCorrect: false, userAnswer: null, processingPattern: 'neural_error' }),
      makeRow({ isCorrect: false, userAnswer: null, processingPattern: 'neural_error' }),
      makeRow({ isCorrect: false, userAnswer: null, processingPattern: 'neural_error' }),
    ];

    const signals = aggregator.buildGuidanceSignals(currentRows, historicalRows);
    const regression = signals.find((s) => s.signalType === 'Historical Regression');
    expect(regression).toBeDefined();
    expect(regression?.historicalTrend).toBeDefined();
    expect(regression?.historicalTrend?.length).toBeGreaterThan(0);

    const critical = signals.find((s) => s.signalType === 'Critical Gap');
    expect(critical?.historicalTrend).toBeDefined();
  });
});
