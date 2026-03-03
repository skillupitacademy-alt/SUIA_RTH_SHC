import { describe, it, expect, vi } from "vitest"

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
  },
  exams: { id: "id" },
  subtopics: { id: "sub" },
}))

import { db } from "@quiz/db"
import { ReportMaterializer } from "../ReportMaterializer"

const mockDb = db as any

describe("ReportMaterializer branches", () => {
  it("throws when exam not found", async () => {
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

    const res = await ReportMaterializer.materialize("e1")
    expect(res.datasets.domain.domainId).toBe("d1")
    expect(mockDb.update).toHaveBeenCalled()
  })
})
