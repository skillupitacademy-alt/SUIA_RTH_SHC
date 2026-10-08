import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const defaultTutorialContent = {
    ai_tutor: {
      greeting: 'Mock greeting',
      qa_pairs: [] as Array<{ question: string; answer: string }>,
    },
  };

  return {
    tokenGetAccess: vi.fn(),
    tokenVerifyAccess: vi.fn(),
    redisIncr: vi.fn(),
    redisExpire: vi.fn(),
    vectorQuery: vi.fn(),
    markComplete: vi.fn(),
    loggerInfo: vi.fn(),
    loggerError: vi.fn(),
    loggerWarn: vi.fn(),
    defaultTutorialContent,
  };
});

vi.mock('@/lib/tutorial-content', () => ({
  DEFAULT_TUTORIAL_CONTENT: mocks.defaultTutorialContent,
}));

vi.mock('@quiz/auth', () => ({
  TokenService: class {
    getAccessToken = mocks.tokenGetAccess;
    static verifyAccessToken = mocks.tokenVerifyAccess;
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    incr = mocks.redisIncr;
    expire = mocks.redisExpire;
    constructor() {}
  },
}));

vi.mock('@upstash/vector', () => ({
  Index: class {
    query = mocks.vectorQuery;
    constructor() {}
  },
}));

vi.mock('@/lib/ai-tutor-progress', () => ({
  markAiTutorBlockComplete: mocks.markComplete,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
    debug: vi.fn(),
  },
}));

import { POST } from '../route';

const userId = crypto.randomUUID();
const subtopicId = crypto.randomUUID();
const token = 'user-token';

const createRequest = (body: Record<string, unknown>, authorization = `Bearer ${token}`) =>
  new Request('https://realtutorialhub.test/api/ai-tutor/query', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization,
    },
    body: JSON.stringify(body),
  });

describe('ai-tutor query route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.defaultTutorialContent.ai_tutor.qa_pairs.length = 0;
    mocks.tokenGetAccess.mockReturnValue(token);
    mocks.tokenVerifyAccess.mockResolvedValue({
      userId,
      email: 'student@example.com',
      roles: ['student'],
    });
    mocks.redisIncr.mockResolvedValue(1);
    mocks.redisExpire.mockResolvedValue(1);
    mocks.vectorQuery.mockResolvedValue([
      { id: '1', score: 0.93, data: 'chunk one', metadata: { blockType: 'notes' } },
      { id: '2', score: 0.89, data: 'chunk two', metadata: { blockType: 'technical' } },
      { id: '3', score: 0.84, data: 'chunk three', metadata: { blockType: 'code' } },
    ]);
    mocks.markComplete.mockResolvedValue({ id: 'progress-1' });
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token');
    vi.stubEnv('UPSTASH_VECTOR_REST_URL', 'https://vector.example.com');
    vi.stubEnv('UPSTASH_VECTOR_REST_TOKEN', 'vector-token');
  });

  it('returns the top 3 chunks for a valid question', async () => {
    const response = await POST(createRequest({
      subtopicId,
      question: 'How do promises chain?',
      difficulty: 'simple',
    }));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source).toBe('vector_search');
    expect(json.answer).toBeNull();
    expect(json.chunks).toHaveLength(3);
    expect(json.chunks[0]).toEqual(expect.objectContaining({
      blockType: 'notes',
      content: 'chunk one',
    }));
    expect(json.questionsRemaining).toBe(9);
    expect(mocks.vectorQuery).toHaveBeenCalledTimes(1);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(expect.objectContaining({
      event: 'ai_tutor.query',
      userId,
      subtopicId,
    }));
    expect(mocks.markComplete).toHaveBeenCalledWith(userId, subtopicId);
  });

  it('returns 401 when no session is present', async () => {
    mocks.tokenGetAccess.mockReturnValue(undefined);

    const response = await POST(createRequest({
      subtopicId,
      question: 'How do promises chain?',
      difficulty: 'simple',
    }, ''));

    expect(response.status).toBe(401);
    expect(mocks.vectorQuery).not.toHaveBeenCalled();
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    mocks.redisIncr.mockResolvedValue(11);

    const response = await POST(createRequest({
      subtopicId,
      question: 'How do promises chain?',
      difficulty: 'simple',
    }));

    expect(response.status).toBe(429);
    expect(mocks.vectorQuery).not.toHaveBeenCalled();
  });

  it('returns an empty chunk list when the vector query has no results', async () => {
    mocks.vectorQuery.mockResolvedValue([]);

    const response = await POST(createRequest({
      subtopicId,
      question: 'How do promises chain?',
      difficulty: 'simple',
    }));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source).toBe('vector_search');
    expect(json.answer).toBeNull();
    expect(json.chunks).toEqual([]);
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(createRequest({
      subtopicId,
      difficulty: 'simple',
    }));

    expect(response.status).toBe(400);
    expect(mocks.vectorQuery).not.toHaveBeenCalled();
  });

  it('returns qa_pairs answer without vector search when a fast-path match exists', async () => {
    mocks.defaultTutorialContent.ai_tutor.qa_pairs.push({
      question: 'What problem do promises solve?',
      answer: 'Promises let JavaScript handle future results without blocking the rest of the app.',
    });

    const response = await POST(createRequest({
      subtopicId,
      question: 'What problem do promises solve?',
      difficulty: 'simple',
    }));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source).toBe('qa_pairs');
    expect(json.answer).toContain('future results');
    expect(json.chunks).toBeNull();
    expect(mocks.vectorQuery).not.toHaveBeenCalled();
    expect(mocks.markComplete).toHaveBeenCalledWith(userId, subtopicId);
  });
});
