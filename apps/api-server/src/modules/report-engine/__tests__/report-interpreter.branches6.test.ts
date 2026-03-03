import { describe, it, expect } from 'vitest';
import { ReportInterpreter } from '../report-interpreter.service';

const baseReport = {
  score: 50,
  mastery: 60,
  readiness: 55,
  confidence: 'HIGH',
  percentile: 40,
  subtopics: [],
  skills: [],
  heatmap: [],
  difficulty: [],
  timeBuckets: { stable: 0, logic: 0, neural: 0 },
  meta: {},
} as any;

describe('ReportInterpreter low-data branches', () => {
  it('adds low-data heatmap narrative when most cells have <3 attempts (lines ~70,74)', () => {
    const report = {
      ...baseReport,
      heatmap: [
        { subtopic: 'Loops', difficulty: 'expert', attempts: 1, accuracy: 60 },
        { subtopic: 'Loops', difficulty: 'intermediate', attempts: 1, accuracy: 80 },
        { subtopic: 'Vars', difficulty: 'expert', attempts: 0, accuracy: 0 },
      ],
    };

    const interpreted = ReportInterpreter.interpret(report);
    const heatmapText = interpreted.heatmap.join(' ');

    expect(heatmapText).toMatch(/Matrix Saturation/);
  });
});
