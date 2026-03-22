import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAiTutorVectorIndex, buildAiTutorVectorChunks, queryAiTutorVector } from '../ai-tutor-vector';
import { Index } from '@upstash/vector';
import { DEFAULT_TUTORIAL_CONTENT } from '../tutorial-content';

vi.mock('@upstash/vector', () => {
  return {
    Index: vi.fn().mockImplementation(function () {
      return { query: vi.fn() };
    }),
  };
});

vi.mock('@quiz/db-tutorial', () => {
  return {
    STANDARD_QUERY_TIMEOUT: 5000,
    withTimeout: vi.fn((promise) => promise),
  };
});

describe('ai-tutor-vector', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, UPSTASH_VECTOR_REST_URL: 'https://test-vector.upstash.io', UPSTASH_VECTOR_REST_TOKEN: 'test-token' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createAiTutorVectorIndex', () => {
    it('creates an Index instance with env vars', () => {
      createAiTutorVectorIndex();
      expect(Index).toHaveBeenCalledWith({
        url: 'https://test-vector.upstash.io',
        token: 'test-token',
      });
    });

    it('throws error if environment variables are missing', () => {
      delete process.env.UPSTASH_VECTOR_REST_URL;
      expect(() => createAiTutorVectorIndex()).toThrowError(/UPSTASH_VECTOR_REST_URL/);
    });
  });

  describe('buildAiTutorVectorChunks', () => {
    it('builds chunks from TutorialContentJSON', () => {
      const subtopicId = 'subtopic-123';
      const difficulty = 'simple';
      const chunks = buildAiTutorVectorChunks(DEFAULT_TUTORIAL_CONTENT, subtopicId, difficulty);
      
      expect(chunks).toHaveLength(5);
      
      const chunkIds = chunks.map(c => c.id);
      expect(chunkIds).toContain(`${subtopicId}:${difficulty}:notes`);
      expect(chunkIds).toContain(`${subtopicId}:${difficulty}:layman`);
      expect(chunkIds).toContain(`${subtopicId}:${difficulty}:real_life`);
      expect(chunkIds).toContain(`${subtopicId}:${difficulty}:technical`);
      expect(chunkIds).toContain(`${subtopicId}:${difficulty}:code`);

      expect(chunks[0].metadata).toEqual({ subtopicId, difficulty, blockType: 'notes' });
    });
  });

  describe('queryAiTutorVector', () => {
    it('queries the index with correct parameters and filters', async () => {
      const mockQuery = vi.fn().mockResolvedValue([{ id: 'mock-1', score: 0.9 }]);
      class MockIndex {
        query = mockQuery;
      }
      vi.mocked(Index).mockImplementation(MockIndex);

      await queryAiTutorVector('how to write async wait?', {
        subtopicId: 'subtopic-xyz',
        difficulty: 'simple',
        topK: 5
      });

      expect(mockQuery).toHaveBeenCalledWith({
        data: 'how to write async wait?',
        topK: 5,
        includeData: true,
        includeMetadata: true,
        filter: "subtopicId = 'subtopic-xyz' and difficulty = 'simple'",
      });
    });

    it('queries without difficulty filter if not provided', async () => {
      const mockQuery = vi.fn().mockResolvedValue([]);
      class MockIndex {
        query = mockQuery;
      }
      vi.mocked(Index).mockImplementation(MockIndex);

      await queryAiTutorVector('what is a promise?', {
        subtopicId: 'subtopic-123',
      });

      expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
        filter: "subtopicId = 'subtopic-123'",
        topK: 3
      }));
    });
  });
});
