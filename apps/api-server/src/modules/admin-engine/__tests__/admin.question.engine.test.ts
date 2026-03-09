import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/modules/auth/audit.service', () => ({
  AuditService: class {
    log = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../core/queue.service', () => ({
  queueService: {
    enqueue: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock db transaction
const txMocks = vi.hoisted(() => ({
  transaction: vi.fn(async (cb: any) => cb({})),
}));

vi.mock('@quiz/db', () => ({ db: txMocks }));

import { container } from '@/modules/core/container';
import { queueService } from '../core/queue.service';
import { SemanticSearchService } from '../intelligence/semantic-search.service';
import { AdminQuestionEngine } from '../admin.question.engine';

describe('AdminQuestionEngine branches', () => {
  const repo = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteBatch: vi.fn(),
    updateStatus: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (container.get as vi.Mock).mockReturnValueOnce(repo) // repository for constructor
      .mockReturnValue({ log: vi.fn().mockResolvedValue(undefined) }); // audit service
  });

  it('getQuestions returns mapped result shape', async () => {
    repo.findAll.mockResolvedValue({ data: [{ id: 'q1' }], total: 1, nextCursor: null, limit: 10 });
    const engine = new AdminQuestionEngine(repo as any, { log: vi.fn() } as any);
    const res = await engine.getQuestions('c', 10, { topicId: 't' });
    expect(res).toEqual({ questions: [{ id: 'q1' }], total: 1, nextCursor: null, limit: 10 });
  });

  it('createQuestion throws on duplicate and queues indexing otherwise', async () => {
    (SemanticSearchService as any).isDuplicate = vi.fn().mockResolvedValue(true);
    repo.create.mockRejectedValueOnce(new Error('CONCEPTUAL_DUPLICATE: A question with this meaning already exists. Please review existing content.'));
    const engine = new AdminQuestionEngine(repo as any, { log: vi.fn().mockResolvedValue(undefined) } as any);
    await expect(engine.createQuestion({ topicId: 't', questionText: 'dup', options: [] } as any, 'admin')).rejects.toThrow('CONCEPTUAL_DUPLICATE');

    (SemanticSearchService as any).isDuplicate = vi.fn().mockResolvedValue(false);
    repo.create.mockResolvedValue({ id: 'n1', topicId: 't', questionText: 'q', difficulty: 'intermediate' });
    const out = await engine.createQuestion({ topicId: 't', questionText: 'q', options: [] } as any, 'admin');
    expect(out.id).toBe('n1');
  });

  it('updateQuestion passes through to repository', async () => {
    repo.update.mockResolvedValue({ id: 'u1' });
    const engine = new AdminQuestionEngine(repo as any, { log: vi.fn().mockResolvedValue(undefined) } as any);
    const res = await engine.updateQuestion('u1', { questionText: 'n' }, 'admin');
    expect(res.id).toBe('u1');
  });

  it('delete, batch delete, and publish paths hit repository methods', async () => {
    repo.delete.mockResolvedValue({ id: 'd1' });
    repo.deleteBatch.mockResolvedValue([{ id: 'd2' }]);
    repo.updateStatus.mockResolvedValue({ id: 'p1' });
    const engine = new AdminQuestionEngine(repo as any, { log: vi.fn().mockResolvedValue(undefined) } as any);
    await expect(engine.deleteQuestion('d1', 'admin')).resolves.toEqual({ id: 'd1' });
    await expect(engine.deleteQuestionsBatch(['a', 'b'], 'admin')).resolves.toEqual([{ id: 'd2' }]);
    await expect(engine.publishQuestion('p1', 'admin')).resolves.toEqual({ id: 'p1' });
  });

  it('bulkCreateQuestionsWithContext reuses createQuestion and logs count', async () => {
    repo.create.mockResolvedValue({ id: 'n1', topicId: 't', questionText: 'q', difficulty: 'intermediate' });
    const audit = { log: vi.fn().mockResolvedValue(undefined) } as any;
    const engine = new AdminQuestionEngine(repo as any, audit);
    const res = await engine.bulkCreateQuestionsWithContext([{ topicId: 't', questionText: 'q', options: [] } as any], { difficulty: 'simple' }, undefined, 'admin');
    expect(res.length).toBe(1);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin_bulk_create_questions' }));
  });
});
