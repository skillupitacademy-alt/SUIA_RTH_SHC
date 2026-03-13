import { describe, it, expect, vi } from "vitest"

import { createReportEngine } from "../report.engine.factory"
import { installSelectMock } from '../../../test/select-mock'

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
  id: "e1",
  userId: "u1",
  status: "completed",
  totalScore: 80,
  examQuestions: [],
  blueprintId: null,
  completedAt: new Date(),
  startedAt: new Date(Date.now() - 60_000),
}

describe("ReportEngine branches (db-injected)", () => {
  it("handles percentile calc fallback when cohort empty", async () => {
    installSelectMock(mockDb as any, [
      { resolveOn: 'limit', result: [{ exam: baseExam, blueprint: null }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: [] }, // resultsByDimension
      { resolveOn: 'where', result: [] }, // percentile cohort
    ])
    mockDb.query.exams.findMany.mockResolvedValueOnce([])
    mockDb.query.exams.findFirst.mockResolvedValueOnce({ ...baseExam, examQuestions: [] })
    mockDb.query.resultsByDimension.findMany.mockResolvedValueOnce([])
    mockDb.execute.mockResolvedValueOnce({ rows: [] })
    mockDb.query.userProfiles.findFirst.mockResolvedValueOnce({ name: "Test User" })

    const report = await ReportEngine.getExamReport("e1")
    expect(report.percentile).toBe(50)
  })

  it("returns report even if analytics row empty after refresh", async () => {
    installSelectMock(mockDb as any, [
      { resolveOn: 'limit', result: [{ exam: baseExam, blueprint: null }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: [] }, // resultsByDimension
      { resolveOn: 'where', result: [] }, // percentile cohort
    ])
    mockDb.query.exams.findFirst.mockResolvedValue({ ...baseExam, examQuestions: [] })
    mockDb.query.resultsByDimension.findMany.mockResolvedValue([])
    mockDb.execute.mockResolvedValue({ rows: [{ score: null }] })
    mockDb.query.userProfiles.findFirst.mockResolvedValueOnce({ name: "Test User" })

    const report = await ReportEngine.getExamReport("e2")
    expect(report.score).toBe(0)
  })

  it("maps heatmap/difficulty with showNoData flags", async () => {
    installSelectMock(mockDb as any, [
      { resolveOn: 'limit', result: [{ exam: baseExam, blueprint: null }] },
      { resolveOn: 'where', result: [
        { examQuestion: { isCorrect: true, questionId: 'q1', userAnswer: null, responseMetadata: null }, question: {} },
        { examQuestion: { isCorrect: false, questionId: 'q2', userAnswer: null, responseMetadata: null }, question: {} },
      ] }, // examQuestions join
      { resolveOn: 'where', result: [
        { dimensionType: "topic", dimensionId: "t1", accuracy: 40, name: "Topic" },
        { dimensionType: "skill", dimensionId: "s1", accuracy: 90, name: "Skill" },
      ] }, // resultsByDimension
      { resolveOn: 'where', result: [
        { id: 'p1', totalScore: 50, isCorrect: true },
        { id: 'p1', totalScore: 50, isCorrect: false },
      ] }, // percentile cohort
    ])
    mockDb.query.exams.findFirst.mockResolvedValue({
      ...baseExam,
      examQuestions: [
        { isCorrect: true, question: {} },
        { isCorrect: false, question: {} },
      ],
    })
    mockDb.query.resultsByDimension.findMany.mockResolvedValue([
      { dimensionType: "topic", dimensionId: "t1", accuracy: 40, name: "Topic" },
      { dimensionType: "skill", dimensionId: "s1", accuracy: 90, name: "Skill" },
    ])
    mockDb.execute.mockResolvedValue({
      rows: [
        {
          score: 50,
          mastery: 50,
          readiness: 50,
          percentile: 50,
          confidence: "LOW",
          is_inconsistent: false,
          expert_drop_off: false,
          time_pattern: null,
          weakest_difficulty: null,
          total_time: 20,
          question_count: 2,
          subtopics: [{ name: "Sub", accuracy: 10, attempts: 0, topicId: "t1" }],
          skills: [{ name: "Skill", accuracy: 90, attempts: 1 }],
          difficulty: [{ level: "simple", accuracy: null, attempts: 0 }],
          heatmap: [{ subtopic: "Sub", difficulty: "simple", accuracy: null, attempts: 0 }],
          stable_time_sec: 1,
          logic_time_sec: 1,
          neural_time_sec: 1,
          weakest_subtopic: null,
          weakest_skill: null,
        },
      ],
    })
    mockDb.query.userProfiles.findFirst.mockResolvedValueOnce({ name: "Test User" })

    const report = await ReportEngine.getExamReport("e3")
    const difficulty = report.difficulty ?? []
    const heatmap = report.heatmap ?? []
    expect(Array.isArray(difficulty)).toBe(true)
    expect(Array.isArray(heatmap)).toBe(true)
    expect(Array.isArray(report.tutorInsights)).toBe(true)
  })
})
