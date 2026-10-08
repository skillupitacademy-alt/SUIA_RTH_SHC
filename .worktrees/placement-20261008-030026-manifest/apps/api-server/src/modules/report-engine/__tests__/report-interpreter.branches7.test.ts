import { describe, it, expect } from 'vitest';
import { ReportInterpreter } from '../report-interpreter.service';

const base = {
  score: 50,
  mastery: 60,
  readiness: 55,
  confidence: 'LOW',
  percentile: 10,
  subtopics: [],
  skills: [],
  heatmap: [
    { subtopic: 'Loops', difficulty: 'expert', attempts: 4, accuracy: 60 },
    { subtopic: 'Loops', difficulty: 'intermediate', attempts: 4, accuracy: 90 },
  ],
  difficulty: [
    { level: 'simple', attempts: 2, accuracy: 70 },
    { level: 'intermediate', attempts: 3, accuracy: 75 },
    { level: 'expert', attempts: 3, accuracy: 60 },
  ],
  timeBuckets: { stable: 0, logic: 0, neural: 0 },
  meta: {},
} as any;

describe('ReportInterpreter expert drop-off branch', () => {
  it('adds Rigidity Alert when intermediate->expert drop >20 (lines ~33-42,64,80-84)', () => {
    const interpreted = ReportInterpreter.interpret(base);
    const heatmapText = interpreted.heatmap.join(' ');
    expect(heatmapText).toMatch(/Rigidity Alert/);
  });
});
