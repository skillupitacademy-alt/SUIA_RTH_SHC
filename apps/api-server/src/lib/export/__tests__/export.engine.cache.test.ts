import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPut = vi.fn();
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();

vi.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => mockPut(...args),
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
  },
}));

vi.mock('@/lib/export/exportQueryBuilder', () => ({
  ExportQueryBuilder: class {
    fetchUserMeta = vi.fn().mockResolvedValue({
      candidateName: 'Test Student',
      candidateEmail: 'test@example.com',
      vectorId: 'VECT1234',
      examId: 'e1',
      startedAt: new Date().toISOString(),
      lineage: { domain: 'D', subject: 'S', topic: 'T' }
    });
    fetchRawAttempts = vi.fn().mockResolvedValue([]);
    fetchHistoricalAttempts = vi.fn().mockResolvedValue([]);
  }
}));

describe('ExportEngine cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached URL when present', async () => {
    mockRedisGet.mockResolvedValueOnce('https://cached.example/export.json');
    const { ExportEngine } = await import('@/lib/export/exportEngine');
    const engine = ExportEngine.getInstance();

    const url = await engine.processExport('e1', 'u1', 'json');
    expect(url).toBe('https://cached.example/export.json');
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('writes to cache on successful export', async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    mockPut.mockResolvedValueOnce({ url: 'https://blob.example/export.zip' });

    const { ExportEngine } = await import('@/lib/export/exportEngine');
    const engine = ExportEngine.getInstance();

    const url = await engine.processExport('e1', 'u1', 'csv');
    expect(url).toBe('https://blob.example/export.zip');
    expect(mockRedisSet).toHaveBeenCalledWith(
      'export:e1:u1:csv',
      'https://blob.example/export.zip',
      { ex: 900 }
    );
  });

  it('continues when cache read fails', async () => {
    mockRedisGet.mockRejectedValueOnce(new Error('redis down'));
    mockPut.mockResolvedValueOnce({ url: 'https://blob.example/export.json' });

    const { ExportEngine } = await import('@/lib/export/exportEngine');
    const engine = ExportEngine.getInstance();

    const url = await engine.processExport('e2', 'u2', 'json');
    expect(url).toBe('https://blob.example/export.json');
    expect(mockPut).toHaveBeenCalled();
  });

  it('ignores empty cache values and proceeds', async () => {
    mockRedisGet.mockResolvedValueOnce('   ');
    mockPut.mockResolvedValueOnce({ url: 'https://blob.example/export.json' });

    const { ExportEngine } = await import('@/lib/export/exportEngine');
    const engine = ExportEngine.getInstance();

    const url = await engine.processExport('e3', 'u3', 'json');
    expect(url).toBe('https://blob.example/export.json');
    expect(mockPut).toHaveBeenCalled();
  });

  it('survives cache write failures', async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    mockRedisSet.mockRejectedValueOnce(new Error('write failed'));
    mockPut.mockResolvedValueOnce({ url: 'https://blob.example/export.json' });

    const { ExportEngine } = await import('@/lib/export/exportEngine');
    const engine = ExportEngine.getInstance();

    const url = await engine.processExport('e4', 'u4', 'json');
    expect(url).toBe('https://blob.example/export.json');
  });
});
