import { describe, it, expect } from "vitest";
import { ReportInterpreter } from "../report-interpreter.service";

const base = {
  examId: "e-mid",
  score: 72,
  mastery: 72,
  readiness: 65,
  percentile: 88,
  confidence: "HIGH",
  isInconsistent: false,
  expertDropOff: false,
  timePattern: null,
  weakest_difficulty: null,
  totalTimeSpentSeconds: 60,
  timeEfficiency: "OPTIMAL",
  subtopics: [],
  skills: [],
  difficulty: [],
  heatmap: [],
  timeBuckets: { stable: 10, logic: 10, neural: 10 },
  ai: { status: "READY", actions: [], nextExamHours: 24 },
  tutorInsights: [],
  lineage: {},
  questions: [],
};

describe("ReportInterpreter mid-band and neutral branches", () => {
  it("emits advancing/borderline KPI without confidence warning", () => {
    const res = ReportInterpreter.interpret(base as any);
    expect(res.kpi.some(b => /ADVANCING/i.test(b))).toBe(true);
    expect(res.kpi.some(b => /BORDERLINE/i.test(b))).toBe(true);
    expect(res.kpi.some(b => /Confidence Warning/i.test(b))).toBe(false);
  });

  it("returns stable mid-range subtopic text and both weak/top skill bullets", () => {
    const report: any = {
      ...base,
      subtopics: [
        { name: "Arrays", accuracy: 75, attempts: 3 },
      ],
      skills: [
        { name: "Debugging", accuracy: 60, attempts: 3 },
        { name: "Logic", accuracy: 90, attempts: 3 },
      ],
    };

    const interpreted = ReportInterpreter.interpret(report);
    expect(interpreted.subtopics.some(b => /stable mid-range/i.test(b))).toBe(true);
    expect(interpreted.skills.some(b => /Friction Points/i.test(b))).toBe(true);
    expect(interpreted.skills.some(b => /Peak Strength/i.test(b))).toBe(true);
  });
});
