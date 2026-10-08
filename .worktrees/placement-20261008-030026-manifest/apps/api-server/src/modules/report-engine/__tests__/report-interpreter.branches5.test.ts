import { describe, it, expect } from 'vitest';
import { ReportInterpreter } from '../report-interpreter.service';

const baseReport = {
  examId: 'r1',
  score: 72,
  mastery: 74,
  readiness: 65,
  percentile: 55,
  confidence: 'LOW',
  subtopics: [],
  skills: [],
  difficulty: [],
  heatmap: [],
  timeBuckets: { stable: 10, logic: 10, neural: 10 },
  totalTimeSpentSeconds: 30,
  expertDropOff: false,
};

describe('ReportInterpreter missing branches', () => {
  it('adds confidence warning in KPI when confidence is LOW', () => {
    const res = ReportInterpreter.interpret(baseReport as any);
    expect(res.kpi.some((b: string) => b.includes('Confidence Warning'))).toBe(true);
  });

  it('returns stable mid-range note when subtopics are significant but neither weak nor strong', () => {
    const report = {
      ...baseReport,
      subtopics: [
        { name: 'Arrays', accuracy: 72, attempts: 3 },
        { name: 'Strings', accuracy: 78, attempts: 4 },
      ],
    };
    const res = ReportInterpreter.interpret(report as any);
    expect(res.subtopics).toEqual([
      'Subtopic performance remains in the stable mid-range; no outliers detected.',
    ]);
  });

  it('hits heatmap expert gap, drop-off, and low-data branches together', () => {
    const report = {
      ...baseReport,
      heatmap: [
        // drop-off + expert gap for SubA
        { subtopic: 'SubA', difficulty: 'intermediate', accuracy: 90, attempts: 3 },
        { subtopic: 'SubA', difficulty: 'expert', accuracy: 60, attempts: 3 },
        // low-data cells (<3 attempts) to trigger Matrix Saturation
        { subtopic: 'SubB', difficulty: 'simple', accuracy: 80, attempts: 1 },
        { subtopic: 'SubC', difficulty: 'expert', accuracy: 50, attempts: 1 },
        { subtopic: 'SubD', difficulty: 'intermediate', accuracy: 70, attempts: 1 },
      ],
    };

    const res = ReportInterpreter.interpret(report as any);
    expect(res.heatmap.some((b: string) => b.includes('Depth Gaps'))).toBe(true);
    expect(res.heatmap.some((b: string) => b.includes('Rigidity Alert'))).toBe(true);
    expect(res.heatmap.some((b: string) => /Matrix Saturation/i.test(b))).toBe(true);
  });

  it('returns empty difficulty bullets when no difficulty data supplied', () => {
    const res = ReportInterpreter.interpret(baseReport as any);
    expect(res.difficulty).toEqual([]);
  });
});
