import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  selectWhereQueue: [] as unknown[],
  insertReturning: vi.fn(),
  insertValues: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  cacheGenerateKey: vi.fn(),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/lib/tracer", () => ({
  withSpan: vi.fn((_: string, fn: (span: { setAttribute: (k: string, v: string | number) => void }) => unknown) =>
    fn({ setAttribute: vi.fn() })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: h.loggerWarn,
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

vi.mock("@/modules/core/cache.service", () => ({
  cacheService: {
    generateKey: h.cacheGenerateKey,
    get: h.cacheGet,
    set: h.cacheSet,
  },
}));

vi.mock("@quiz/db", () => ({
  db: {
    insert: h.insert,
    select: h.select,
  },
  examBlueprints: { id: "id" },
  questions: { id: "id", status: "status", difficulty: "difficulty", topicId: "topicId", subtopicId: "subtopicId" },
  subjects: { id: "id", domainId: "domainId" },
  topics: { id: "id", subjectId: "subjectId" },
  subtopics: { id: "id", topicId: "topicId" },
}));

import { cacheService } from "@/modules/core/cache.service";
import { db } from "@quiz/db";
import { ExamBlueprintService } from "../ExamBlueprintService";

describe("ExamBlueprintService coverage", () => {
  let service: ExamBlueprintService;

  beforeEach(() => {
    vi.clearAllMocks();
    h.selectWhereQueue.length = 0;
    h.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => (h.selectWhereQueue.length > 0 ? h.selectWhereQueue.shift() : [])),
      })),
    }));
    h.insertValues.mockReturnValue({ returning: h.insertReturning });
    h.insert.mockReturnValue({ values: h.insertValues });
    h.cacheGenerateKey.mockReturnValue("blueprint:key");
    h.cacheGet.mockResolvedValue(null);
    h.cacheSet.mockResolvedValue(undefined);
    h.insertReturning.mockResolvedValue([{ id: "bp-1" }]);
    service = new ExamBlueprintService();
  });

  it("calculates mixed and single-tier distributions", () => {
    expect((service as any).calculateDistribution(10, "mixed")).toEqual({
      simple: 3,
      intermediate: 3,
      expert: 4,
    });
    expect((service as any).calculateDistribution(5, "simple")).toEqual({
      simple: 5,
      intermediate: 0,
      expert: 0,
    });
    expect((service as any).calculateDistribution(6, "intermediate")).toEqual({
      simple: 0,
      intermediate: 6,
      expert: 0,
    });
    expect((service as any).calculateDistribution(7, "expert")).toEqual({
      simple: 0,
      intermediate: 0,
      expert: 7,
    });
  });

  it("fetchQuestions returns empty when count is zero", async () => {
    const result = await (service as any).fetchQuestions(0, "simple", "d1");
    expect(result).toEqual([]);
    expect(h.select).not.toHaveBeenCalled();
  });

  it("fetchQuestions returns empty when no IDs match", async () => {
    h.selectWhereQueue.push([], [], []);
    const result = await (service as any).fetchQuestions(2, "simple", "d1");
    expect(result).toEqual([]);
  });

  it("fetchQuestions shuffles and slices selected IDs", async () => {
    h.selectWhereQueue.push([], [], [{ id: "q1" }, { id: "q2" }, { id: "q3" }]);
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.42);

    const result = await (service as any).fetchQuestions(2, "intermediate", "d1");

    expect(result).toHaveLength(2);
    expect(result.map((r: { id: string }) => r.id).every((id: string) => ["q1", "q2", "q3"].includes(id))).toBe(true);
    randomSpy.mockRestore();
  });

  it("fetchQuestions applies deepest selection wins logic", async () => {
    h.selectWhereQueue.push(
      [{ topicId: "t1" }],
      [{ subjectId: "s1" }],
      [],
      [{ id: "x1" }]
    );
    const result = await (service as any).fetchQuestions(
      5,
      "expert",
      "d1",
      ["s1", "s2"],
      ["t1", "t2"],
      ["st1"]
    );
    expect(result).toEqual([{ id: "x1" }]);
    expect(h.select).toHaveBeenCalled();
  });

  it("fetchQuestions falls back to domain scope when no filters are provided", async () => {
    h.selectWhereQueue.push([], [], [{ id: "q1" }]);

    const result = await (service as any).fetchQuestions(1, "simple", "d1");

    expect(result).toEqual([{ id: "q1" }]);
  });

  it("countQuestions returns numeric count and zero fallback", async () => {
    h.selectWhereQueue.push(
      [{ topicId: "t1" }],
      [{ subjectId: "s2" }],
      [{ count: "7" }]
    );
    const count = await (service as any).countQuestions("simple", "d1", ["s1", "s2"], ["t1"], ["st1"]);
    expect(count).toBe(7);

    h.selectWhereQueue.push([], [], [{ count: undefined }]);
    const fallback = await (service as any).countQuestions("simple", "d1");
    expect(fallback).toBe(0);
  });

  it("countQuestions falls back to domain scope when no filters are provided", async () => {
    h.selectWhereQueue.push([], [], [{ count: "2" }]);

    const count = await (service as any).countQuestions("intermediate", "d1");

    expect(count).toBe(2);
  });

  it("countQuestions resolves subject parents from topic filters", async () => {
    h.selectWhereQueue.push([{ subjectId: "s1" }], [{ count: "3" }]);

    const count = await (service as any).countQuestions("simple", "d1", [], ["t1"]);

    expect(count).toBe(3);
  });

  it("getAvailableCounts returns cached payload when present", async () => {
    const cached = { simple: 1, intermediate: 2, expert: 3, total: 6, isReady: false };
    h.cacheGet.mockResolvedValue(cached);
    const spy = vi.spyOn(service as any, "countQuestions");

    const result = await service.getAvailableCounts({ domainId: "d1" });

    expect(result).toEqual(cached);
    expect(spy).not.toHaveBeenCalled();
  });

  it("getAvailableCounts computes counts, readiness, and stores cache", async () => {
    const spy = vi
      .spyOn(service as any, "countQuestions")
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5);

    const result = await service.getAvailableCounts({ domainId: "d1" });

    expect(result).toEqual({ simple: 4, intermediate: 4, expert: 5, total: 13, isReady: true });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(cacheService.set).toHaveBeenCalledWith("blueprint:key", result, 1000 * 60 * 5);
  });

  it("getAvailableCounts falls back to DB when cache read/write fails", async () => {
    h.cacheGet.mockRejectedValue(new Error("cache read failed"));
    h.cacheSet.mockRejectedValue(new Error("cache write failed"));
    vi.spyOn(service as any, "countQuestions")
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const result = await service.getAvailableCounts({ domainId: "d1" });

    expect(result).toEqual({ simple: 1, intermediate: 1, expert: 1, total: 3, isReady: false });
    expect(h.loggerWarn).toHaveBeenCalled();
  });

  it("generateBlueprint throws when no questions are found", async () => {
    vi.spyOn(service as any, "fetchQuestions")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(
      service.generateBlueprint({
        domainId: "d1",
        questionCount: 10,
        difficultyPreference: "mixed",
      })
    ).rejects.toThrow("Zero questions found for the selected criteria.");
  });

  it("generateBlueprint inserts and returns new blueprint id", async () => {
    vi.spyOn(service as any, "fetchQuestions")
      .mockResolvedValueOnce([{ id: "s1" }])
      .mockResolvedValueOnce([{ id: "i1" }])
      .mockResolvedValueOnce([{ id: "e1" }, { id: "e2" }]);

    const id = await service.generateBlueprint({
      domainId: "d1",
      questionCount: 4,
      difficultyPreference: "mixed",
      subtopicIds: ["st1"],
    });

    expect(id).toBe("bp-1");
    expect(db.insert).toHaveBeenCalled();
    expect(h.insertValues).toHaveBeenCalled();
  });
});
