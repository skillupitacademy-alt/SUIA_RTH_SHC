import { describe, it, expect } from "vitest";
import { ReportInterpreter } from "../report-interpreter.service";

const base = {
  score: 80,
  mastery: 75,
  readiness: 70,
  percentile: 50,
  confidence: "HIGH",
  isInconsistent: false,
  expertDropOff: false,
  timePattern: null,
  weakest_difficulty: null,
  totalTimeSpentSeconds: 90,
  timeEfficiency: "OPTIMAL",
  subtopics: [],
  skills: [],
  difficulty: [
    { level: "intermediate", accuracy: 90, attempts: 3 },
    { level: "expert", accuracy: 60, attempts: 3 },
  ],
  heatmap: [],
  // Tune ratios to trigger both "High error density" and "High Logic-phase volume" branches
  timeBuckets: { stable: 10, logic: 50, neural: 40 },
  ai: { status: "READY", actions: [], nextExamHours: 12 },
  tutorInsights: [],
  lineage: {},
  questions: [],
};

describe("ReportInterpreter expert drop-off & time branches", () => {
  it("flags complexity friction and time alerts", () => {
    const interpreted = ReportInterpreter.interpret(base as any);
    expect(interpreted.difficulty.some(b => /Complexity Friction/i.test(b))).toBe(true);
    expect(interpreted.time.some(b => /High error density/i.test(b))).toBe(true);
    expect(interpreted.time.some(b => /High Logic-phase volume/i.test(b))).toBe(true);
  });
});
