import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTutorialContentBySubtopicId, tutorialContentRepository } from '../tutorial-content-api';
import { DEFAULT_TUTORIAL_CONTENT, SEED_SUBTOPIC_ID } from '../tutorial-content';

vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }
}));

vi.mock('@quiz/db-tutorial', () => {
  return {
    TutorialContentRepository: vi.fn().mockImplementation(function () {
      return { getPublished: vi.fn() };
    }),
  };
});

describe('tutorial-content-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTutorialContentBySubtopicId', () => {
    it('returns null for invalid UUID subtopicId', async () => {
      const result = await getTutorialContentBySubtopicId('invalid-uuid-string');
      expect(result).toBeNull();
    });

    it('fetches published content from DB successfully', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const mockDate = new Date();
      const mockRecord = {
        id: 'record-id',
        subtopicId: validUuid,
        difficulty: 'simple',
        contentType: 'standard',
        content: DEFAULT_TUTORIAL_CONTENT,
        version: 1,
        language: 'en',
        isPublished: true,
        generatedByAi: false,
        aiModelUsed: null,
        generationJobId: null,
        adminApprovedBy: null,
        adminApprovedAt: null,
        qualityScore: null,
        regenerationCount: 0,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      vi.mocked(tutorialContentRepository.getPublished).mockResolvedValue([mockRecord] as never);

      const result = await getTutorialContentBySubtopicId(validUuid);

      expect(tutorialContentRepository.getPublished).toHaveBeenCalledWith(validUuid, 'simple');
      expect(result).toBeDefined();
      expect(result?.id).toBe('record-id');
      expect(result?.createdAt).toBe(mockDate.toISOString());
    });

    it('returns fallback content when DB fails and subtopicId is seed ID', async () => {
      vi.mocked(tutorialContentRepository.getPublished).mockRejectedValue(new Error('Connection error'));

      const result = await getTutorialContentBySubtopicId(SEED_SUBTOPIC_ID);

      expect(result).toBeDefined();
      expect(result?.id).toBe('seed');
      expect(result?.subtopicId).toBe(SEED_SUBTOPIC_ID);
      expect(result?.content).toEqual(DEFAULT_TUTORIAL_CONTENT);
    });

    it('returns null when DB fails and subtopicId is not seed ID', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      vi.mocked(tutorialContentRepository.getPublished).mockRejectedValue(new Error('Connection error'));

      const result = await getTutorialContentBySubtopicId(validUuid);

      expect(result).toBeNull();
    });
  });
});
