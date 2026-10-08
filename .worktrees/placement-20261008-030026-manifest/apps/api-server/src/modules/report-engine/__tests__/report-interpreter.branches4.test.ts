import { describe, it, expect } from 'vitest';
import { ReportInterpreter } from '../report-interpreter.service';

const baseReport: any = {
  examId: 'exam-fluency',
  score: 68,
  mastery: 65,
  readiness: 58,
  percentile: 40,
  confidence: 'HIGH',
  subtopics: [],
  skills: [],
  difficulty: [],
  heatmap: [],
  timeBuckets: { stable: 0, logic: 0, neural: 0 },
  questions: [],
  ai: { status: 'READY', actions: [], nextExamHours: 12 },
};

describe('ReportInterpreter additional branches (time + difficulty)', () => {
  it('returns no-temporal-data note when all buckets are zero', () => {
    const res = ReportInterpreter.interpret(baseReport);
    expect(res.time[0]).toMatch(/No temporal data recorded/i);
  });

  it('emits fluency alert and neural confusion when logic dominates and neural high', () => {
    const report = {
      ...baseReport,
      timeBuckets: { stable: 20, logic: 55, neural: 35 }, // logicPct > 40, stablePct < 30, neuralPct > 30
    };
    const res = ReportInterpreter.interpret(report as any);
    expect(res.time.some((b) => /Fluency Alert/i.test(b))).toBe(true);
    expect(res.time.some((b) => /High error density/i.test(b))).toBe(true);
  });

  it('covers difficulty bullets for all three levels and drop comparison', () => {
    const report = {
      ...baseReport,
      difficulty: [
        { level: 'simple', accuracy: 80, attempts: 3 },
        { level: 'intermediate', accuracy: 75, attempts: 3 },
        { level: 'expert', accuracy: 50, attempts: 3 }, // triggers drop > 15 and unstable state
      ],
    };

    const res = ReportInterpreter.interpret(report as any);
    expect(res.difficulty.some((b) => /Foundations/i.test(b))).toBe(true);
    expect(res.difficulty.some((b) => /Logic Base/i.test(b))).toBe(true);
    expect(res.difficulty.some((b) => /Expert Load/i.test(b))).toBe(true);
    expect(res.difficulty.some((b) => /Complexity Friction/i.test(b))).toBe(true);
  });
});
