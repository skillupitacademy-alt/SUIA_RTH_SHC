import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AcademicHierarchyService,
  MAX_BATCH_DELETE_SIZE,
  validateBatchDeletePayload,
  isValidUuid,
  DependencyCheckUnavailableError,
  checkDomainDependencies,
} from '../academic-hierarchy.service';

const UUID_1 = '00000000-0000-4000-8000-000000000001';
const UUID_2 = '00000000-0000-4000-8000-000000000002';

const mockDb = vi.hoisted(() => ({
  selectResult: [] as unknown[],
  deleteResult: [] as unknown[],
  deleteCalls: [] as unknown[],
  throwOnSelect: false,
  transactionCalled: false,
}));

vi.mock('@quiz/db', () => {
  const createChain = () => ({
    from: () => createChain(),
    where: () => createChain(),
    orderBy: () => createChain(),
    for: () => createChain(),
    limit: async () => {
      if (mockDb.throwOnSelect) {
        throw new Error('Connection terminated unexpectedly');
      }
      return mockDb.selectResult;
    },
    then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
      if (mockDb.throwOnSelect) {
        const err = new Error('Connection terminated unexpectedly');
        if (reject) return reject(err);
        throw err;
      }
      return Promise.resolve(mockDb.selectResult).then(resolve, reject);
    },
  });

  const createClient = () => ({
    select: () => createChain(),
    delete: () => ({
      where: (cond: unknown) => {
        mockDb.deleteCalls.push(cond);
        return {
          returning: async () => mockDb.deleteResult,
        };
      },
    }),
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      mockDb.transactionCalled = true;
      return callback(createClient());
    },
  });

  return {
    domains: { id: 'domains.id', name: 'domains.name', createdAt: 'domains.createdAt' },
    subjects: { id: 'subjects.id', domainId: 'subjects.domainId', name: 'subjects.name', createdAt: 'subjects.createdAt' },
    topics: { id: 'topics.id', subjectId: 'topics.subjectId', name: 'topics.name', createdAt: 'topics.createdAt' },
    subtopics: { id: 'subtopics.id', topicId: 'subtopics.topicId', name: 'subtopics.name', createdAt: 'subtopics.createdAt' },
    skills: { id: 'skills.id', name: 'skills.name', createdAt: 'skills.createdAt' },
    questions: {
      id: 'questions.id',
      topicId: 'questions.topicId',
      subtopicId: 'questions.subtopicId',
      skillId: 'questions.skillId',
      deletedAt: 'questions.deletedAt',
    },
    questionSkills: {
      questionId: 'questionSkills.questionId',
      skillId: 'questionSkills.skillId',
    },
    topicSkills: {
      topicId: 'topicSkills.topicId',
      skillId: 'topicSkills.skillId',
    },
    getDb: () => createClient(),
  };
});

vi.mock('@quiz/db-tutorial', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    }),
  },
  tutorialSidebarTreesV2: { topicId: 'tutorialSidebarTreesV2.topicId' },
  tutorialSubtopics: { id: 'tutorialSubtopics.id', externalId: 'tutorialSubtopics.externalId' },
  tutorialSections: { id: 'tutorialSections.id', subtopicId: 'tutorialSections.subtopicId', deletedAt: 'tutorialSections.deletedAt' },
}));

describe('AcademicHierarchyService - Validation and Delete Safety', () => {
  beforeEach(() => {
    mockDb.selectResult = [];
    mockDb.deleteResult = [{ id: UUID_1 }];
    mockDb.deleteCalls = [];
    mockDb.throwOnSelect = false;
    mockDb.transactionCalled = false;
  });

  describe('validateBatchDeletePayload', () => {
    it('accepts valid array of UUIDs and deduplicates them', () => {
      const result = validateBatchDeletePayload({ ids: [UUID_1, UUID_2, UUID_1] }, 'Domain');
      expect(result.success).toBe(true);
      expect(result.ids).toEqual([UUID_1, UUID_2]);
    });

    it('rejects empty array with 400', () => {
      const result = validateBatchDeletePayload({ ids: [] }, 'Domain');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe('Domain IDs are required');
    });

    it('rejects non-array with 400', () => {
      const result = validateBatchDeletePayload({ ids: 'not-an-array' }, 'Subject');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe('Subject IDs are required');
    });

    it('rejects batch size exceeding maximum limit with 413', () => {
      const largeArray = Array.from({ length: MAX_BATCH_DELETE_SIZE + 1 }, (_, i) =>
        `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`
      );
      const result = validateBatchDeletePayload({ ids: largeArray }, 'Topic');
      expect(result.success).toBe(false);
      expect(result.status).toBe(413);
      expect(result.error).toContain('Batch size exceeds maximum limit of 100 items');
    });

    it('rejects invalid UUID format with 400', () => {
      const result = validateBatchDeletePayload({ ids: [UUID_1, 'invalid-uuid-123'] }, 'Subtopic');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain('Invalid UUID format');
    });

    it('rejects deeply nested JSON payloads', () => {
      let deepPayload: Record<string, unknown> = { ids: [UUID_1] };
      for (let i = 0; i < 15; i++) {
        deepPayload = { nested: deepPayload };
      }
      const result = validateBatchDeletePayload(deepPayload, 'Domain');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });
  });

  describe('isValidUuid', () => {
    it('returns true for canonical UUIDs', () => {
      expect(isValidUuid(UUID_1)).toBe(true);
      expect(isValidUuid(UUID_2)).toBe(true);
    });

    it('returns false for malformed or injection strings', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid("00000000-0000-0000-0000-000000000001' OR '1'='1")).toBe(false);
      expect(isValidUuid('')).toBe(false);
    });
  });

  describe('BC-CORR-01: Fail Closed on DB Read Outage', () => {
    it('throws DependencyCheckUnavailableError when underlying database query fails', async () => {
      mockDb.throwOnSelect = true;
      await expect(checkDomainDependencies(UUID_1)).rejects.toThrow(DependencyCheckUnavailableError);
    });

    it('aborts deleteDomain and returns 503 instead of failing open when DB select throws', async () => {
      mockDb.throwOnSelect = true;

      const result = await AcademicHierarchyService.deleteDomain(UUID_1);
      expect(result.status).toBe(503);
      expect(result.error).toContain('temporarily unavailable');
      // CRITICAL: delete must NOT have been called!
      expect(mockDb.deleteCalls.length).toBe(0);
    });

    it('aborts batchDeleteDomains and returns 503 when DB select throws', async () => {
      mockDb.throwOnSelect = true;

      const result = await AcademicHierarchyService.batchDeleteDomains({ ids: [UUID_1, UUID_2] });
      expect(result.status).toBe(503);
      expect(result.error).toContain('temporarily unavailable');
      expect(mockDb.deleteCalls.length).toBe(0);
    });
  });

  describe('BC-CORR-03: Transaction-Wrapped Atomic Deletion', () => {
    it('executes deleteDomain inside a database transaction', async () => {
      mockDb.selectResult = [];
      mockDb.deleteResult = [{ id: UUID_1 }];

      const result = await AcademicHierarchyService.deleteDomain(UUID_1);
      expect(result.status).toBe(200);
      expect(mockDb.transactionCalled).toBe(true);
      expect(mockDb.deleteCalls.length).toBe(1);
    });

    it('executes batchDeleteDomains inside a single database transaction', async () => {
      mockDb.selectResult = [];

      const result = await AcademicHierarchyService.batchDeleteDomains({ ids: [UUID_1, UUID_2] });
      expect(result.status).toBe(200);
      expect(mockDb.transactionCalled).toBe(true);
      expect(mockDb.deleteCalls.length).toBe(1);
    });
  });

  describe('AcademicHierarchyService.deleteDomain', () => {
    it('blocks deletion with 409 Conflict when child subjects exist', async () => {
      mockDb.selectResult = [{ id: 'sub-1', domainId: UUID_1, name: 'Child Subject' }];

      const result = await AcademicHierarchyService.deleteDomain(UUID_1);
      expect(result.status).toBe(409);
      expect(result.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(result.entityType).toBe('domain');
      expect(result.dependencies?.subjects).toBe(1);
      expect(mockDb.deleteCalls.length).toBe(0);
    });

    it('blocks deletion with 409 Conflict even if dependent child record has deletedAt set (physical retention check for CASCADE safety)', async () => {
      // Physical row check: a soft-deleted child record in PostgreSQL still has foreign key
      // and would be physically deleted or violate constraints on parent hard-delete
      mockDb.selectResult = [{ id: 'sub-soft-deleted', domainId: UUID_1, deletedAt: new Date() }];

      const result = await AcademicHierarchyService.deleteDomain(UUID_1);
      expect(result.status).toBe(409);
      expect(result.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(result.dependencies?.subjects).toBe(1);
      expect(mockDb.deleteCalls.length).toBe(0);
    });

    it('deletes successfully with 200 when no child subjects exist', async () => {
      mockDb.selectResult = [];
      mockDb.deleteResult = [{ id: UUID_1 }];

      const result = await AcademicHierarchyService.deleteDomain(UUID_1);
      expect(result.status).toBe(200);
      expect(result.message).toBe('Domain deleted successfully');
      expect(mockDb.deleteCalls.length).toBe(1);
    });

    it('returns 404 when domain does not exist', async () => {
      mockDb.selectResult = [];
      mockDb.deleteResult = []; // Not found

      const result = await AcademicHierarchyService.deleteDomain(UUID_1);
      expect(result.status).toBe(404);
      expect(result.error).toBe('Domain not found');
    });

    it('returns 400 for invalid UUID format', async () => {
      const result = await AcademicHierarchyService.deleteDomain('invalid-id');
      expect(result.status).toBe(400);
      expect(result.error).toContain('Invalid UUID');
    });
  });

  describe('AcademicHierarchyService.batchDeleteDomains', () => {
    it('blocks batch deletion with 409 Conflict if any domain has child subjects', async () => {
      mockDb.selectResult = [{ id: 'sub-2', domainId: UUID_2, name: 'Child Subject' }];

      const result = await AcademicHierarchyService.batchDeleteDomains({ ids: [UUID_1, UUID_2] });
      expect(result.status).toBe(409);
      expect(result.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(result.conflictingIds).toContain(UUID_2);
      expect(mockDb.deleteCalls.length).toBe(0);
    });

    it('deletes batch with 200 when all domains are free of dependencies', async () => {
      mockDb.selectResult = [];

      const result = await AcademicHierarchyService.batchDeleteDomains({ ids: [UUID_1, UUID_2] });
      expect(result.status).toBe(200);
      expect(result.message).toBe('2 domains deleted successfully');
      expect(mockDb.deleteCalls.length).toBe(1);
    });
  });

  describe('AcademicHierarchyService.deleteSubject', () => {
    it('blocks deletion with 409 Conflict when child topics exist', async () => {
      mockDb.selectResult = [{ id: 'top-1', subjectId: UUID_1, name: 'Child Topic' }];

      const result = await AcademicHierarchyService.deleteSubject(UUID_1);
      expect(result.status).toBe(409);
      expect(result.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(result.dependencies?.topics).toBe(1);
    });

    it('deletes successfully with 200 when no child topics exist', async () => {
      mockDb.selectResult = [];
      mockDb.deleteResult = [{ id: UUID_1 }];

      const result = await AcademicHierarchyService.deleteSubject(UUID_1);
      expect(result.status).toBe(200);
    });
  });

  describe('AcademicHierarchyService.deleteTopic', () => {
    it('blocks deletion with 409 Conflict when child subtopics exist', async () => {
      mockDb.selectResult = [{ id: 'subtop-1', topicId: UUID_1, name: 'Child Subtopic' }];

      const result = await AcademicHierarchyService.deleteTopic(UUID_1);
      expect(result.status).toBe(409);
      expect(result.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(result.dependencies?.subtopics).toBe(1);
    });

    it('BC-CORR-02: blocks deletion with 409 Conflict when dependent questions exist', async () => {
      mockDb.selectResult = [{ id: 'q-1', topicId: UUID_1 }];

      const result = await AcademicHierarchyService.deleteTopic(UUID_1);
      expect(result.status).toBe(409);
      expect(result.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(result.dependencies?.questions).toBe(1);
    });

    it('deletes successfully with 200 when no child subtopics or questions exist', async () => {
      mockDb.selectResult = [];
      mockDb.deleteResult = [{ id: UUID_1 }];

      const result = await AcademicHierarchyService.deleteTopic(UUID_1);
      expect(result.status).toBe(200);
    });
  });

  describe('AcademicHierarchyService.deleteSubtopic', () => {
    it('BC-CORR-02: blocks deletion with 409 Conflict when questions reference the subtopic', async () => {
      mockDb.selectResult = [{ id: 'q-sub-1', subtopicId: UUID_1 }];

      const result = await AcademicHierarchyService.deleteSubtopic(UUID_1);
      expect(result.status).toBe(409);
      expect(result.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(result.dependencies?.questions).toBe(1);
    });

    it('deletes successfully with 200 when no dependents exist', async () => {
      mockDb.selectResult = [];
      mockDb.deleteResult = [{ id: UUID_1 }];

      const result = await AcademicHierarchyService.deleteSubtopic(UUID_1);
      expect(result.status).toBe(200);
    });
  });

  describe('AcademicHierarchyService.deleteSkill', () => {
    it('BC-CORR-02: blocks deletion with 409 Conflict when topicSkills reference the skill', async () => {
      mockDb.selectResult = [{ topicId: UUID_2, skillId: UUID_1 }];

      const result = await AcademicHierarchyService.deleteSkill(UUID_1);
      expect(result.status).toBe(409);
      expect(result.conflictType).toBe('DEPENDENCY_CONFLICT');
      expect(result.dependencies?.topicSkills).toBe(1);
    });

    it('deletes successfully with 200 when no dependencies exist', async () => {
      mockDb.selectResult = [];
      mockDb.deleteResult = [{ id: UUID_1 }];

      const result = await AcademicHierarchyService.deleteSkill(UUID_1);
      expect(result.status).toBe(200);
    });
  });
});
