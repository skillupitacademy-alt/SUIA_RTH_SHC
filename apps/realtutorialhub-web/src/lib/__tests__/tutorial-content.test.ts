import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSeededTutorialContent, DEFAULT_TUTORIAL_CONTENT, SEED_SUBTOPIC_ID } from '../tutorial-content';
import { TutorialContentRepository } from '@quiz/db-tutorial';

vi.mock('@quiz/db-tutorial', () => {
  return {
    TutorialContentRepository: vi.fn(),
  };
});

describe('tutorial-content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns content from DB if published content exists', async () => {
    const mockContentJSON = { ...DEFAULT_TUTORIAL_CONTENT, ai_tutor: { greeting: 'Custom greeting from DB', qa_pairs: [] } };
    const mockRow = {
      isPublished: true,
      content: mockContentJSON
    };

    const mockFindBySubtopicId = vi.fn().mockResolvedValue([mockRow]);
    vi.mocked(TutorialContentRepository).mockImplementation(() => ({
      findBySubtopicId: mockFindBySubtopicId
    }) as any);

    const result = await getSeededTutorialContent();
    expect(mockFindBySubtopicId).toHaveBeenCalledWith(SEED_SUBTOPIC_ID, 'simple');
    expect(result).toEqual(mockContentJSON);
  });

  it('returns the first row if no published content exists', async () => {
    const mockContentJSON = { ...DEFAULT_TUTORIAL_CONTENT, ai_tutor: { greeting: 'Draft greeting', qa_pairs: [] } };
    const mockRow = {
      isPublished: false,
      content: mockContentJSON
    };

    const mockFindBySubtopicId = vi.fn().mockResolvedValue([mockRow]);
    vi.mocked(TutorialContentRepository).mockImplementation(() => ({
      findBySubtopicId: mockFindBySubtopicId
    }) as any);

    const result = await getSeededTutorialContent();
    expect(result).toEqual(mockContentJSON);
  });

  it('falls back to embedded DEFAULT_TUTORIAL_CONTENT when DB throws error', async () => {
    const mockFindBySubtopicId = vi.fn().mockRejectedValue(new Error('DB Connection Failed'));
    vi.mocked(TutorialContentRepository).mockImplementation(() => ({
      findBySubtopicId: mockFindBySubtopicId
    }) as any);

    const result = await getSeededTutorialContent();
    expect(result).toEqual(DEFAULT_TUTORIAL_CONTENT);
  });

  it('falls back to embedded DEFAULT_TUTORIAL_CONTENT when DB returns empty array', async () => {
    const mockFindBySubtopicId = vi.fn().mockResolvedValue([]);
    vi.mocked(TutorialContentRepository).mockImplementation(() => ({
      findBySubtopicId: mockFindBySubtopicId
    }) as any);

    const result = await getSeededTutorialContent();
    expect(result).toEqual(DEFAULT_TUTORIAL_CONTENT);
  });
});
