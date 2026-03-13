import { describe, it, expect, vi } from "vitest";

vi.mock("@/modules/report-engine/performance.service", () => ({
  PerformanceService: {
    cacheReport: vi.fn().mockResolvedValue(undefined),
    getCachedReport: vi.fn().mockResolvedValue(null),
    refreshAnalytics: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/modules/adaptive-engine/adaptive-tutor.service", () => ({
  AdaptiveTutorService: {
    generateInsights: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/modules/report-engine/report-interpreter.service", () => ({
  ReportInterpreter: {
    interpret: vi.fn().mockReturnValue({}),
  },
}));

import { createReportEngine } from "../report.engine.factory";
import { installSelectMock } from '../../../test/select-mock';

const mockDb = {
  query: {
    exams: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    resultsByDimension: { findMany: vi.fn() },
    examQuestions: { findFirst: vi.fn() },
    userProfiles: { findFirst: vi.fn() },
  },
  execute: vi.fn(),
} as any;

const ReportEngine = createReportEngine({ db: mockDb as any });

describe("ReportEngine heatmap & AI action branches", () => {
  it("normalizes heatmap difficulty and returns high-score action set", async () => {
    installSelectMock(mockDb as any, [
      { resolveOn: 'limit', result: [{ exam: { id: "exam-hm", userId: "u1", status: "completed", blueprintId: null, completedAt: new Date(), startedAt: new Date(Date.now() - 20_000) }, blueprint: null }] },
      { resolveOn: 'limit', result: [{ name: 'User' }] }, // candidateName
    ]);
    mockDb.query.exams.findFirst.mockResolvedValue({
      id: "exam-hm",
      userId: "u1",
      status: "completed",
      blueprintId: null,
      completedAt: new Date(),
      startedAt: new Date(Date.now() - 20_000),
    });
    mockDb.query.exams.findMany.mockResolvedValue([]); // percentile cohort
    mockDb.query.resultsByDimension.findMany.mockResolvedValue([]);
    mockDb.query.examQuestions.findFirst.mockResolvedValue(null); // lineage fallback unused
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ name: "User" });

    // First runCoreQuery returns core row with score 96 and data
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          {
            score: 96,
            question_count: 10,
            total_time: 200,
            mastery: 90,
            readiness: 95,
            percentile: 80,
            confidence: "HIGH",
            is_inconsistent: false,
            weakest_subtopic: "loops",
            weakest_skill: "arrays",
            weakest_difficulty: "advanced",
            time_pattern: "fast_and_correct",
            stable_time_sec: 10,
            logic_time_sec: 20,
            neural_time_sec: 30,
            expert_drop_off: false,
            subtopics: [{ topicId: "t1", name: "JS", accuracy: 90, attempts: 2 }],
            skills: [{ name: "arrays", accuracy: 88, attempts: 3 }],
            difficulty: [{ level: "advanced", accuracy: 80, attempts: 0 }],
            heatmap: [{ subtopic: "JS", difficulty: "simple", accuracy: 70, attempts: 0 }],
          },
        ],
      })
      // rawQuestions
      .mockResolvedValueOnce({ rows: [] });

    const report = await ReportEngine.getPremiumExamReport("exam-hm");

    expect(report.heatmap[0].difficulty).toBe("Novice");
    expect(report.heatmap[0].showNoData).toBe(true);
    expect(report.difficulty[0].showNoData).toBe(true);
    expect(report.ai.status).toBe("READY");
    expect(report.ai.actions).toEqual([
      "Maintain current performance baseline",
      "Expand into Expert-level edge cases",
      "Final verification of neural stability",
    ]);
  });
});
