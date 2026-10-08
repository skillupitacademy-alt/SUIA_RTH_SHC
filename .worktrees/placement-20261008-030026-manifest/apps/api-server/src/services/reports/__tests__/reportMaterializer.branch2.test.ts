import { describe, it, expect, vi } from "vitest"

const makeSelect = (rows: any[] = []) => ({
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown) => void) => resolve(rows),
});

vi.mock("@quiz/db", () => ({
  db: {
    query: {
      exams: {
        findFirst: vi.fn(),
      },
      subtopics: {
        findMany: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    })),
    select: vi.fn(),
  },
  exams: { id: "id" },
  users: { id: "id" },
  examQuestions: { id: "eq" },
  questions: { id: "q" },
  topics: { id: "t" },
  subjects: { id: "s" },
  domains: { id: "d" },
  subtopics: { id: "sub" },
}))

import { db } from "@quiz/db"
import { ReportMaterializer } from "../ReportMaterializer"

const mockDb = db as any

describe("ReportMaterializer branches", () => {
  it("throws when exam not found", async () => {
    mockDb.select.mockReturnValueOnce(makeSelect([]));
    mockDb.query.exams.findFirst.mockResolvedValue(undefined)
    await expect(ReportMaterializer.materialize("x")).rejects.toThrow(/Exam not found/)
  })

  it("handles empty subtopic list and update write", async () => {
    mockDb.query.exams.findFirst.mockResolvedValue({
      id: "e1",
      examQuestions: [
        {
          id: "eq1",
          userAnswer: null,
          isCorrect: true,
          responseMetadata: null,
          question: {
            questionText: "Q1",
            correctAnswer: "A",
            explanation: "",
            difficulty: "simple",
            topicId: "t1",
            topic: {
              name: "Topic1",
              subjectId: "s1",
              subject: {
                name: "Subj",
                domainId: "d1",
                domain: { name: "Dom" },
              },
            },
            subtopicId: null,
          },
        },
      ],
    })
    mockDb.query.subtopics.findMany.mockResolvedValue([])

    const examRow: any = { id: "e1", userId: "u1", user: null };
    const questionRowsResolved = [
      {
        examQuestion: {
          id: "eq1",
          userAnswer: null,
          isCorrect: true,
          responseMetadata: null,
        },
        question: {
          questionText: "Q1",
          correctAnswer: "A",
          explanation: "",
          difficulty: "simple",
          topicId: "t1",
          subtopicId: null,
        },
        topic: { name: "Topic1", subjectId: "s1" },
        subject: { name: "Subj", domainId: "d1" },
        domain: { name: "Dom" },
      },
    ];

    mockDb.select
      .mockReturnValueOnce(makeSelect([{ exam: examRow, user: null }]))
      .mockReturnValueOnce(makeSelect(questionRowsResolved));

    const res = await ReportMaterializer.materialize("e1")
    expect(res.datasets.domain.domainId).toBe("d1")
    expect(mockDb.update).toHaveBeenCalled()
  })
})
