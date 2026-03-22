import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  query: vi.fn(),
  delete: vi.fn(),
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
  loggerInfo: vi.fn(),
}));

vi.mock('@upstash/vector', () => ({
  Index: class {
    upsert = mocks.upsert;
    query = mocks.query;
    delete = mocks.delete;
    constructor() {}
  },
}));

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 5_000,
  withTimeout: mocks.withTimeout,
}));

vi.mock('pino', () => ({
  default: () => ({
    info: mocks.loggerInfo,
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  buildAiTutorVectorChunks,
  createAiTutorVectorIndex,
  deleteSubtopicContent,
  indexSubtopicContent,
  querySubtopicContent,
} from '../vector.service';

const content = {
  notes: { markdown: 'Notes block content', image: null },
  layman: {
    simpleExplanation: 'Simple explanation',
    analogyOrStory: 'Analogy story',
    example1: { company: 'Company A', content: 'Example 1' },
    example2: { company: 'Company B', content: 'Example 2' },
    image: null,
  },
  real_life: {
    title: 'Real life title',
    scenario: 'Real life scenario',
    bullets: [{ label: 'One', detail: 'Detail' }],
    tip: 'Helpful tip',
    image: null,
  },
  technical: {
    markdown: 'Technical notes',
    bullets: [{ term: 'Term', detail: 'Detail' }],
    tip: 'Technical tip',
    image: null,
  },
  code: {
    language: 'javascript',
    intro: 'Code intro',
    code: 'console.log("hello")',
    steps: ['step 1', 'step 2'],
    image: null,
  },
  ai_tutor: {
    greeting: 'Hello',
    qa_pairs: [{ question: 'What is a promise?', answer: 'A promise is a future value.' }],
  },
} as const;

describe('vector.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsert.mockResolvedValue({ success: true });
    mocks.query.mockResolvedValue([
      {
        id: 'chunk-1',
        score: 0.92,
        data: 'chunk content',
        metadata: { blockType: 'notes' },
      },
    ]);
    mocks.delete.mockResolvedValue({ deleted: 1 });
    vi.stubEnv('UPSTASH_VECTOR_REST_URL', 'https://vector.example.com');
    vi.stubEnv('UPSTASH_VECTOR_REST_TOKEN', 'vector-token');
  });

  it('indexSubtopicContent creates five chunks and upserts them', async () => {
    const chunks = await indexSubtopicContent('subtopic-1', 'simple', content as never);

    expect(chunks).toHaveLength(5);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(expect.objectContaining({
      event: 'content.indexed',
      subtopicId: 'subtopic-1',
      difficulty: 'simple',
    }));
  });

  it('querySubtopicContent maps vector results into chunk summaries', async () => {
    const results = await querySubtopicContent('subtopic-1', 'promise?', 3, 'simple');

    expect(results).toEqual([
      expect.objectContaining({
        blockType: 'notes',
        content: 'chunk content',
        score: 0.92,
      }),
    ]);
    expect(mocks.query).toHaveBeenCalledWith(expect.objectContaining({
      data: 'promise?',
      topK: 3,
      filter: "subtopicId = 'subtopic-1' and difficulty = 'simple'",
      includeData: true,
      includeMetadata: true,
    }));
  });

  it('deleteSubtopicContent deletes vectors by subtopic and difficulty', async () => {
    await deleteSubtopicContent('subtopic-1', 'simple');

    expect(mocks.delete).toHaveBeenCalledWith({
      filter: "subtopicId = 'subtopic-1' and difficulty = 'simple'",
    });
  });

  it('createAiTutorVectorIndex requires env vars', () => {
    delete process.env.UPSTASH_VECTOR_REST_URL;
    expect(() => createAiTutorVectorIndex()).toThrow(/UPSTASH_VECTOR_REST_URL/);
  });
});
