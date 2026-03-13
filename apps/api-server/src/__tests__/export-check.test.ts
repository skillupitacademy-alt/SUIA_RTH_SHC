import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportEngine } from '../lib/export/exportEngine';
import { put } from '@vercel/blob';

// Mock Vercel Blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://mockblob.vercel.app/export.zip' })
}));

// Mock Database/QueryBuilder
vi.mock('../lib/export/exportQueryBuilder', () => {
  return {
    ExportQueryBuilder: class {
      fetchUserMeta = vi.fn().mockResolvedValue({
        candidateName: 'Test Student',
        examTitle: 'Advanced Mathematics',
        completedAt: new Date().toISOString(),
        score: 85,
        percentile: 92
      });
      fetchRawAttempts = vi.fn().mockResolvedValue([
        {
          questionId: 'q1',
          questionText: 'What is 2+2?',
          userAnswer: '4',
          correctAnswer: '4',
          isCorrect: true,
          timeSpentSeconds: 15,
          topicName: 'Arithmetic',
          subtopicName: 'Addition',
          difficulty: 'simple',
          timestamp: new Date().toISOString()
        }
      ]);
      fetchHistoricalAttempts = vi.fn().mockResolvedValue([
        {
          examId: 'old-e1',
          score: 70,
          completedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  };
});

describe('ExportEngine Manual Verification', () => {
  const engine = ExportEngine.getInstance();
  const mockExamId = 'test-exam-id';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process JSON export correctly', async () => {
    const url = await engine.processExport(mockExamId, mockUserId, 'json');
    
    expect(url).toBe('https://mockblob.vercel.app/export.zip');
    expect(put).toHaveBeenCalledWith(
      expect.stringContaining('.json'),
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'application/json' })
    );
  });

  it('should process CSV (ZIP) export correctly', async () => {
    const url = await engine.processExport(mockExamId, mockUserId, 'csv');
    
    expect(url).toBe('https://mockblob.vercel.app/export.zip');
    expect(put).toHaveBeenCalledWith(
      expect.stringContaining('.zip'),
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'application/zip' })
    );
  });

  it('should throw error for unsupported format', async () => {
    await expect(engine.processExport(mockExamId, mockUserId, 'pdf' as any))
      .rejects.toThrow('Unsupported format');
  });
});
