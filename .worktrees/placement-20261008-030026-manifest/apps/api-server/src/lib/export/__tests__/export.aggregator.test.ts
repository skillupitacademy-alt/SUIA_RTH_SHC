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
  domain: 'Computer Science',
  subject: 'Databases',
  topic: 'SQL',
  subtopic: 'Joins',
  questionId: 'q1',
  questionText: 'What is an inner join?',
  correctAnswer: 'A',
  userAnswer: 'A',
  isCorrect: true,
  difficulty: 'simple',
  timeSpentSeconds: 20,
  thresholdSeconds: 35,
  skillName: 'Query Optimization',
  skillCategory: null,
  processingPattern: 'stable',
  isImpulsive: false,
  isDiligent: true,
  masteryWeight: 1,
  weightedScore: 1,
  ...overrides,
});

describe('ExportAggregator', () => {
  const aggregator = new ExportAggregator();

  describe('buildAggregations', () => {
    it('computes basic metrics correctly for a single row', async () => {
      const rows = [makeRow({ isCorrect: true, timeSpentSeconds: 30 })];
      const aggs = await aggregator.buildAggregations(rows);
      
      expect(aggs.L1_domain[0].accuracyPct).toBe(100);
      expect(aggs.L1_domain[0].avgTimeSec).toBe(30);
      expect(aggs.L1_domain[0].totalAttempts).toBe(1);
    });

    it('handles multiple aggregation levels', async () => {
      const rows = [
        makeRow({ domain: 'D1', subject: 'S1', topic: 'T1' }),
        makeRow({ domain: 'D1', subject: 'S1', topic: 'T2' }),
      ];
      const aggs = await aggregator.buildAggregations(rows);
      
      expect(aggs.L1_domain.length).toBe(1);
      expect(aggs.L2_domain_subject.length).toBe(1);
      expect(aggs.L3_domain_subject_topic.length).toBe(2);
    });

    it('calculates processing pattern percentages', async () => {
      const rows = [
        makeRow({ processingPattern: 'stable' }),
        makeRow({ processingPattern: 'logic' }),
        makeRow({ processingPattern: 'neural_error' }),
        makeRow({ processingPattern: 'stable' }),
      ];
      const aggs = await aggregator.buildAggregations(rows);
      const res = aggs.L1_domain[0];
      
      expect(res.stableProcessingPct).toBe(50);
      expect(res.logicProcessingPct).toBe(25);
      expect(res.errorTimePct).toBe(25);
    });

    it('calculates behavioral metrics (impulsive/diligent)', async () => {
      const rows = [
        makeRow({ isImpulsive: true, isDiligent: false }),
        makeRow({ isImpulsive: false, isDiligent: true }),
      ];
      const aggs = await aggregator.buildAggregations(rows);
      
      expect(aggs.L1_domain[0].impulsivePct).toBe(50);
      expect(aggs.L1_domain[0].diligentPct).toBe(50);
    });

    it('calculates expert vs simple accuracy and dropoff', async () => {
      const rows = [
        makeRow({ difficulty: 'simple', isCorrect: true }),
        makeRow({ difficulty: 'Expert', isCorrect: false }), // check case sensitivity
      ];
      const aggs = await aggregator.buildAggregations(rows);
      const res = aggs.L1_domain[0];
      
      expect(res.simpleAccuracyPct).toBe(100);
      expect(res.expertAccuracyPct).toBe(0);
      expect(res.expertDropoff).toBe(100);
    });

    it('assigns readiness levels based on thresholds', async () => {
      const aggregator = new ExportAggregator();
      
      const expertReady = await aggregator.buildAggregations([makeRow({ difficulty: 'expert', isCorrect: true })]);
      expect(expertReady.L1_domain[0].readinessLevel).toBe('Expert-Ready');

      const lowIntermediate = await aggregator.buildAggregations([
        makeRow({ difficulty: 'expert', isCorrect: true }),
        makeRow({ difficulty: 'expert', isCorrect: false }),
        makeRow({ difficulty: 'expert', isCorrect: false }),
      ]); // 33.3% accuracy < 35
      expect(lowIntermediate.L1_domain[0].readinessLevel).toBe('Novice-Stable');
      
      const rows40 = [
        makeRow({ difficulty: 'expert', isCorrect: true }),
        makeRow({ difficulty: 'expert', isCorrect: true }),
        makeRow({ difficulty: 'expert', isCorrect: false }),
        makeRow({ difficulty: 'expert', isCorrect: false }),
        makeRow({ difficulty: 'expert', isCorrect: false }),
      ]; // 40% accuracy >= 35
      const res40 = await aggregator.buildAggregations(rows40);
      expect(res40.L1_domain[0].readinessLevel).toBe('Intermediate');

      const novice = await aggregator.buildAggregations([makeRow({ difficulty: 'expert', isCorrect: false })]);
      expect(novice.L1_domain[0].readinessLevel).toBe('Novice-Stable');
    });
  });

  describe('buildHistoricalProgress', () => {
    it('returns empty array if no historical rows', async () => {
      const res = await aggregator.buildHistoricalProgress([]);
      expect(res).toEqual([]);
    });

    it('computes trends between sessions', async () => {
      const rows = [
        makeRow({ sessionId: 's1', sessionDate: '2024-01-01', isCorrect: false, subtopic: 'T', skillName: 'K' }),
        makeRow({ sessionId: 's2', sessionDate: '2024-01-02', isCorrect: true, subtopic: 'T', skillName: 'K' }),
        makeRow({ sessionId: 's3', sessionDate: '2024-01-03', isCorrect: false, subtopic: 'T', skillName: 'K' }),
      ];
      const res = await aggregator.buildHistoricalProgress(rows);
      
      expect(res.length).toBe(3);
      expect(res[0].trend).toBe('stable'); // first session
      expect(res[1].trend).toBe('improving'); // 0 -> 100
      expect(res[2].trend).toBe('regressing'); // 100 -> 0
    });
  });

  describe('buildGuidanceSignals', () => {
    it('generates Critical Gap signals', () => {
      const current = [
        makeRow({ isCorrect: false, difficulty: 'hard' }),
        makeRow({ isCorrect: false, difficulty: 'hard' }),
      ]; // 0% accuracy, 2 attempts
      const signals = aggregator.buildGuidanceSignals(current, []);
      expect(signals.some(s => s.signalType === 'Critical Gap')).toBe(true);
    });

    it('generates Skill Deficit signals', () => {
      const current = [
        makeRow({ weightedScore: 0, masteryWeight: 10 }),
      ]; // 0% mastery
      const signals = aggregator.buildGuidanceSignals(current, []);
      expect(signals.some(s => s.signalType === 'Skill Deficit')).toBe(true);
    });

    it('generates Time Anomaly signals', () => {
      const current = [
        makeRow({ timeSpentSeconds: 100 }),
      ];
      const signals = aggregator.buildGuidanceSignals(current, []);
      expect(signals.some(s => s.signalType === 'Time Anomaly')).toBe(true);
    });

    it('generates Strength Zone signals', () => {
      const current = [
        makeRow({ processingPattern: 'stable', isCorrect: true }),
      ];
      const signals = aggregator.buildGuidanceSignals(current, []);
      expect(signals.some(s => s.signalType === 'Strength Zone')).toBe(true);
    });

    it('generates Historical Regression signals', () => {
      const history = [
        makeRow({ sessionDate: '2024-01-01', isCorrect: true }),
      ];
      const current = [
        makeRow({ isCorrect: false }),
      ];
      const signals = aggregator.buildGuidanceSignals(current, history);
      expect(signals.some(s => s.signalType === 'Historical Regression')).toBe(true);
    });

    it('handles empty historical trends in signals', () => {
      const current = [makeRow({ isCorrect: false, difficulty: 'hard', totalAttempts: 5 })]; // Wait, totalAttempts is calculated
      const rows = [
        makeRow({ isCorrect: false }),
        makeRow({ isCorrect: false }),
      ];
      const signals = aggregator.buildGuidanceSignals(rows, []);
      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].historicalTrend).toEqual([]);
    });
  });
});
