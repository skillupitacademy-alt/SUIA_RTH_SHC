import { describe, it, expect } from "vitest";
import { ReportInterpreter } from "../report-interpreter.service";

const base = {
  examId: "e1",
  score: 0,
  mastery: 0,
  readiness: 0,
  percentile: 0,
  confidence: "LOW",
  isInconsistent: false,
  expertDropOff: false,
  timePattern: null,
  weakest_difficulty: null,
  totalTimeSpentSeconds: 0,
  timeEfficiency: "OPTIMAL",
  subtopics: [],
  skills: [],
  difficulty: [],
  heatmap: [],
  timeBuckets: { stable: 0, logic: 0, neural: 0 },
  ai: { status: "DATA_INSUFFICIENT", actions: [], nextExamHours: 48 },
  tutorInsights: [],
  lineage: {},
  questions: [],
};

describe("ReportInterpreter empty data branches", () => {
  it("returns default bullets when no subtopics/skills/heatmap data", () => {
    const interpreted = ReportInterpreter.interpret(base as any);
    expect(interpreted.subtopics[0]).toMatch(/No subtopic-level diagnostics/i);
    expect(interpreted.skills[0]).toMatch(/Insufficient data/i);
    expect(interpreted.heatmap[0]).toMatch(/Matrix Saturation|Balanced/i);
    expect(interpreted.time[0]).toMatch(/No temporal data/i);
  });
});
