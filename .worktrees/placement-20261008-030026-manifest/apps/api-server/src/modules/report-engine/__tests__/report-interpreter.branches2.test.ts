import { describe, it, expect } from "vitest";
import { ReportInterpreter } from "../report-interpreter.service";

const baseReport = {
  examId: "exam-1",
  score: 75,
  mastery: 72,
  readiness: 65,
  percentile: 50,
  confidence: "HIGH",
  isInconsistent: false,
  expertDropOff: false,
  timePattern: null,
  weakest_difficulty: null,
  totalTimeSpentSeconds: 120,
  timeEfficiency: "OPTIMAL",
  subtopics: [],
  skills: [],
  difficulty: [],
  heatmap: [],
  timeBuckets: { stable: 0, logic: 0, neural: 0 },
  ai: { status: "READY", actions: [], nextExamHours: 12 },
  tutorInsights: [],
  lineage: {},
  questions: [],
};

describe("ReportInterpreter additional branch coverage", () => {
  it("flags expert gaps, rigidity drop, low-data saturation and direct recall time branch", () => {
    const report: any = {
      ...baseReport,
      score: 82,
      mastery: 80,
      readiness: 78,
      heatmap: [
        { subtopic: "Loops", difficulty: "intermediate", accuracy: 90, attempts: 3 },
        { subtopic: "Loops", difficulty: "expert", accuracy: 60, attempts: 3 }, // depth gap + drop >20
        { subtopic: "Variables", difficulty: "simple", accuracy: 80, attempts: 1 }, // low-data
        { subtopic: "Arrays", difficulty: "simple", accuracy: 75, attempts: 1 },   // low-data
        { subtopic: "Functions", difficulty: "intermediate", accuracy: 70, attempts: 2 }, // low-data
      ],
      timeBuckets: { stable: 70, logic: 20, neural: 10 }, // triggers stablePct > 60
    };

    const res = ReportInterpreter.interpret(report);
    expect(res.heatmap.some(b => /Depth Gaps/i.test(b))).toBe(true);
    expect(res.heatmap.some(b => /Rigidity Alert/i.test(b))).toBe(true);
    expect(res.heatmap.some(b => /Matrix Saturation/i.test(b))).toBe(true);
    expect(res.time.some(b => /Direct Recall/i.test(b))).toBe(true);
  });

  it("adds strategic misalignment and readiness gap meta notes", () => {
    const report: any = {
      ...baseReport,
      score: 85,
      readiness: 55, // readiness gap (<60 with score >70)
      expertDropOff: true,
      confidence: "LOW",
    };

    const meta = ReportInterpreter.interpret(report).meta;
    expect(meta.some(b => /Strategic Misalignment/i.test(b))).toBe(true);
    expect(meta.some(b => /Readiness Gap/i.test(b))).toBe(true);
    expect(meta.some(b => /Analytical Limit/i.test(b))).toBe(true);
  });
});
