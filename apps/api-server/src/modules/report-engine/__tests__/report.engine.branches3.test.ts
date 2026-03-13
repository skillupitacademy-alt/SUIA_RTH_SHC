import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/modules/report-engine/performance.service", () => ({
  PerformanceService: {
    refreshAnalytics: vi.fn().mockResolvedValue(undefined),
    cacheReport: vi.fn().mockResolvedValue(undefined),
    getCachedReport: vi.fn().mockResolvedValue(null),
  },
}))

vi.mock("@/modules/analytics/user-analytics.service", () => ({
  UserAnalyticsService: {
    getTopicPerformance: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock("@/modules/adaptive-engine/adaptive-tutor.service", () => ({
  AdaptiveTutorService: {
    generateInsights: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock("@/modules/report-engine/report-interpreter.service", () => ({
  ReportInterpreter: {
    interpret: vi.fn().mockReturnValue({}),
  },
}))

import { createReportEngine } from "../report.engine.factory"
import { installSelectMock } from '../../../test/select-mock'

const mockDb = {
  query: {
    exams: { findFirst: vi.fn(), findMany: vi.fn() },
    resultsByDimension: { findMany: vi.fn() },
    examQuestions: { findFirst: vi.fn() },
    userProfiles: { findFirst: vi.fn() },
  },
  execute: vi.fn(),
} as any

const ReportEngine = createReportEngine({ db: mockDb as any })

const baseExam = {
  id: "e-late",
  userId: "u1",
  status: "completed",
  totalScore: 0,
  examQuestions: [],
  blueprintId: null,
  completedAt: new Date(),
  startedAt: new Date(Date.now() - 30_000),
}

beforeEach(() => {
  mockDb.query.exams.findFirst.mockReset();
  mockDb.query.exams.findMany.mockReset();
  mockDb.query.resultsByDimension.findMany.mockReset();
  mockDb.query.examQuestions.findFirst.mockReset();
  mockDb.query.userProfiles.findFirst.mockReset();
  mockDb.query.resultsByDimension.findMany.mockResolvedValue([]);
  mockDb.execute.mockReset();
  installSelectMock(mockDb as any, [
    { resolveOn: 'limit', result: [{ exam: baseExam, blueprint: null }] },
    { resolveOn: 'limit', result: [{ name: 'User' }] }, // candidateName
  ]);
})

describe("ReportEngine late branches", () => {
  it("throws when analytics still missing after refresh", async () => {
    mockDb.query.exams.findFirst.mockResolvedValue({ ...baseExam, examQuestions: [] })
    mockDb.query.resultsByDimension.findMany.mockResolvedValue([])
    mockDb.query.exams.findMany.mockResolvedValue([]) // percentile cohort
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ name: "User" })
    mockDb.execute.mockImplementationOnce(async () => ({ rows: [] })) // first core query
    mockDb.execute.mockImplementationOnce(async () => ({ rows: [] })) // after refresh
    mockDb.execute.mockImplementationOnce(async () => ({ rows: [] })) // rawQuestions
    // force calculatePercentile to return 50 but not short-circuit
    vi.spyOn(ReportEngine as any, "calculatePercentile").mockResolvedValue(50)

    mockDb.query.exams.findMany.mockResolvedValue([]) // percentile cohort for calculatePercentile

    await expect(ReportEngine.getPremiumExamReport("missing-analytics")).rejects.toThrow(/precomputed/i)
  })

  it("sets AI status DATA_INSUFFICIENT when score null", async () => {
    mockDb.query.exams.findFirst.mockResolvedValue({ ...baseExam, examQuestions: [] })
    mockDb.query.resultsByDimension.findMany.mockResolvedValue([])
    mockDb.query.exams.findMany.mockResolvedValue([]) // percentile cohort
    mockDb.query.userProfiles.findFirst.mockResolvedValue({ name: "User" })
    vi.spyOn(ReportEngine as any, "calculatePercentile").mockResolvedValue(50)
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          {
            score: null,
            mastery: null,
            readiness: null,
            percentile: null,
            confidence: "LOW",
            is_inconsistent: false,
            expert_drop_off: false,
            time_pattern: null,
            weakest_difficulty: null,
            total_time: 0,
            question_count: 0,
            subtopics: [],
            skills: [],
            difficulty: [],
            heatmap: [],
            stable_time_sec: 0,
            logic_time_sec: 0,
            neural_time_sec: 0,
            weakest_subtopic: null,
            weakest_skill: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            score: null,
            mastery: null,
            readiness: null,
            percentile: null,
            confidence: "LOW",
            is_inconsistent: false,
            expert_drop_off: false,
            time_pattern: null,
            weakest_difficulty: null,
            total_time: 0,
            question_count: 0,
            subtopics: [],
            skills: [],
            difficulty: [],
            heatmap: [],
            stable_time_sec: 0,
            logic_time_sec: 0,
            neural_time_sec: 0,
            weakest_subtopic: null,
            weakest_skill: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // rawQuestions

    mockDb.query.exams.findMany.mockResolvedValue([]) // percentile cohort for calculatePercentile

    const report = await ReportEngine.getPremiumExamReport("ai-null-score")
    expect(report.ai.status).toBe("DATA_INSUFFICIENT")
  })
})
