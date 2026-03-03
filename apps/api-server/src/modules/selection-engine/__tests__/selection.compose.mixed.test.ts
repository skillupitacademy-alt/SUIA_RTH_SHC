import { describe, it, expect, vi } from "vitest"

import { SelectionService } from "../selection.service"

describe("SelectionService composeExam mixed difficulty", () => {
  it("samples mixed tiers without error", async () => {
    // No static blueprint; force dynamic path
    vi.spyOn(SelectionService as any, "resolveBlueprint").mockResolvedValue({ questionIds: [] })
    vi.spyOn(SelectionService as any, "resolveSelectionCriteria").mockResolvedValue({
      finalSubtopicIds: ["s1"],
      actualTopicIds: [],
      actualSubjectIds: [],
      requestedTotal: 3,
      difficultyPref: "mixed",
    })
    // Mock dynamic selection to return a full mixed set in one call (matches actual flow which calls once per tier)
    vi.spyOn(SelectionService as any, "executeDynamicSelection").mockResolvedValue([
      { id: "q1" },
      { id: "q2" },
      { id: "q3" },
    ])

    const result = await SelectionService.composeExam("u1", "bp1", "idem")
    expect(result.questions).toEqual([{ id: "q1" }, { id: "q2" }, { id: "q3" }])
  })
})
