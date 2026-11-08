import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@quiz/db';
import { redis } from '@/lib/redis';
import { storage } from '@/lib/storage';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { GET } from '../route';

vi.mock('@quiz/db', () => ({ db: { query: { exams: { findFirst: vi.fn() } }, update: vi.fn() }, exams: { id: 'exam.id' } }));
vi.mock('@/lib/redis', () => ({ redis: { get: vi.fn(), del: vi.fn() } }));
vi.mock('@/lib/storage', () => ({ storage: { exists: vi.fn() } }));
const secret = new TextEncoder().encode('isolated-url-test-secret-32bytes!');
const tokenService = new TokenService(secret, secret, secret);
const previous = container.get(TokenService);

async function invoke(userId: string, brand: 'skillup' | 'realtutorialhub') {
  const token = await tokenService.generateAccessToken({ userId, originalUserId: userId, shadowUserId: userId,
    email: 'learner@example.test', roles: ['student'], brand, tokenType: 'user', aud: 'user' });
  const req = new NextRequest('http://localhost/api/export/urls?examId=exam-1&format=json', {
    headers: { authorization: `Bearer ${token}`, 'x-user-id': 'forged' },
  });
  return GET(req, undefined);
}

describe('export URL ownership and effects', () => {
  beforeEach(() => {
    vi.clearAllMocks(); container.register(TokenService, tokenService);
    vi.mocked(db.query.exams.findFirst).mockResolvedValue({ userId: 'owner', brand: 'skillup', exportUrls: { analytics_json: 'private-ref' } } as never);
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(storage.exists).mockResolvedValue(true);
  });
  afterEach(() => container.register(TokenService, previous));
  it('allows owner and checks the existing artifact', async () => {
    const response = await invoke('owner', 'skillup');
    expect(response.status).toBe(200);
    expect(storage.exists).toHaveBeenCalledTimes(1);
  });
  it('denies another learner before cache, storage and writes', async () => {
    const response = await invoke('other', 'skillup');
    expect(response.status).toBe(403);
    expect(redis.get).not.toHaveBeenCalled(); expect(storage.exists).not.toHaveBeenCalled(); expect(db.update).not.toHaveBeenCalled();
  });
  it('denies missing exams before cache, storage and writes', async () => {
    vi.mocked(db.query.exams.findFirst).mockResolvedValueOnce(undefined as never);
    const response = await invoke('owner', 'skillup');
    expect(response.status).toBe(404);
    expect(redis.get).not.toHaveBeenCalled(); expect(storage.exists).not.toHaveBeenCalled(); expect(db.update).not.toHaveBeenCalled();
  });
  it('denies foreign tenant with equal owner ID before private effects', async () => {
    const response = await invoke('owner', 'realtutorialhub');
    expect.soft(response.status).toBe(403);
    expect.soft(redis.get).not.toHaveBeenCalled(); expect(storage.exists).not.toHaveBeenCalled(); expect(db.update).not.toHaveBeenCalled();
  });
});
