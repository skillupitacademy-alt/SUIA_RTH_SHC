import { db } from '@quiz/db';
import { describe, expect, it, vi } from 'vitest';

import { cacheService } from '@/modules/core/cache.service';
import { DomainService, SubjectService, TopicService } from '@/modules/domain/domain.service';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { TrendsService } from '@/modules/metrics/trends.service';
import { WeightedScoringStrategy } from '@/modules/scoring-engine/strategies/weighted-scoring.strategy';

describe('final uncovered-line closeout', () => {
  it('covers remaining domain invalidation statements', async () => {
    vi.spyOn(cacheService, 'del').mockRejectedValue(new Error('cache down'));

    (db as any).update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'x1' }]),
        }),
      }),
    });
    (db as any).delete = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'x1' }]),
      }),
    });

    await DomainService.updateDomain('d1', { name: 'Domain 1' } as any);
    await DomainService.deleteDomain('d1');
    await DomainService.deleteDomainsBatch(['d1', 'd2']);

    await SubjectService.updateSubject('s1', { name: 'Subject 1' });
    await SubjectService.deleteSubject('s1');
    await SubjectService.deleteSubjectsBatch(['s1']);

    await TopicService.updateTopic('t1', { subjectId: 's1', name: 'Topic 1' });

    expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d1');
    expect(cacheService.del).toHaveBeenCalledWith('metadata:topics:subject:s1');
  });

  it('covers exam cache-get catch/nullish assignment statement', async () => {
    const engine = Object.create(ExamEngine.prototype) as any;
    engine.examRepo = {
      findByIdWithBlueprint: vi.fn().mockResolvedValue({
        id: 'e1',
        userId: 'u1',
        status: 'started',
      }),
    };

    vi.spyOn(cacheService, 'get').mockRejectedValueOnce(new Error('cache down'));
    vi.spyOn(cacheService, 'set').mockResolvedValue(undefined as any);

    const result = await engine.getAndCacheActiveExam('u1', 'e1');
    expect(result.id).toBe('e1');
  });

  it('covers zero-scores continue branch in skill trends aggregation', async () => {
    (db as any).query = {
      exams: {
        findMany: vi.fn().mockResolvedValue([{ id: 'e1', completedAt: new Date('2026-01-01') }]),
      },
      resultsByDimension: {
        findMany: vi.fn().mockResolvedValue([
          { examId: 'missing-exam', dimensionType: 'skill', dimensionId: 's1', name: 'Skill 1', accuracy: 50 },
        ]),
      },
    };

    const trends = await TrendsService.getSkillTrends({ range: '7d' });
    expect(trends).toEqual([]);
  });

  it('covers weighted strategy default difficulty weight', () => {
    const strategy = new WeightedScoringStrategy();
    const score = strategy.calculateOverallScore([
      {
        examQuestion: { isCorrect: true },
        question: { difficulty: 'unknown-level' },
      } as any,
    ]);

    expect(score).toBe(100);
  });
});
