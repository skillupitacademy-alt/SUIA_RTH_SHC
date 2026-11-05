import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';

const mockJobsService = vi.hoisted(() => ({
  createJob: vi.fn(async (input: unknown) => ({ id: 'job-123', ...input })),
  updateJobStatus: vi.fn(async () => ({})),
}));

const mockAdminQuestionEngine = vi.hoisted(() => ({
  bulkCreateQuestionsWithContext: vi.fn(async (questions: unknown[]) => questions),
}));

const mockDuplicateDetector = vi.hoisted(() => ({
  evaluate: vi.fn(async () => ({ status: 'unique' })),
}));

const mockBatchDuplicateDetector = vi.hoisted(() => ({
  findBatchDuplicateDetails: vi.fn(() => []),
}));

vi.mock('@/modules/auth/rbac.service', () => ({ _verifyAdmin: vi.fn(), _verifyActiveAccount: vi.fn() }));
vi.mock('@/modules/auth/admin-audience.util', () => ({
  requireAdminRouteAccess: vi.fn(async () => ({ userId: 'admin-principal', brand: 'skillhubcore' })),
}));
vi.mock('@/modules/system/jobs.service', () => ({ JobsService: mockJobsService }));
vi.mock('@/modules/admin-engine/admin.engine', () => ({ AdminQuestionEngine: mockAdminQuestionEngine }));
vi.mock('@/modules/question/duplicate-detector', () => ({ DuplicateDetector: mockDuplicateDetector }));
vi.mock('@/modules/question/batch-duplicate-detector', () => mockBatchDuplicateDetector);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, statusText: 'Not Found' })));
});
afterEach(() => { vi.unstubAllGlobals(); });

const validPayload = {
  topicId: '11111111-1111-4111-8111-111111111111',
  questions: [{
    questionText: 'What is 2+2?',
    type: 'mcq',
    options: [
      { text: 'Three', isCorrect: false },
      { text: 'Four', isCorrect: true },
    ]
  }]
};

async function makeRequest(body: unknown) {
  return POST(new NextRequest('http://localhost/api/admin/questions/bulk', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
    body: JSON.stringify(body),
  }), undefined);
}

describe('FND20 bulk question route validation', () => {
  describe('schema validation at API boundary', () => {
    it('accepts valid bulk question payload with workflow fallback', async () => {
      const response = await makeRequest(validPayload);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).toHaveBeenCalledTimes(1);
    });

    it('rejects payload with invalid topicId UUID', async () => {
      const response = await makeRequest({ ...validPayload, topicId: 'not-a-uuid' });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('BAD_REQUEST');
    });

    it('rejects payload with empty questions array', async () => {
      const response = await makeRequest({ topicId: validPayload.topicId, questions: [] });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('BAD_REQUEST');
    });

    it('rejects question with unsupported type', async () => {
      const response = await makeRequest({
        ...validPayload,
        questions: [{ questionText: 'Q?', type: 'unsupported', options: ['A'] }]
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('BAD_REQUEST');
    });

    it('rejects question with empty options array', async () => {
      const response = await makeRequest({
        ...validPayload,
        questions: [{ questionText: 'Q?', type: 'mcq', options: [] }]
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('BAD_REQUEST');
    });

    it('rejects question with blank questionText', async () => {
      const response = await makeRequest({
        ...validPayload,
        questions: [{ questionText: '', type: 'mcq', options: ['A', 'B'] }]
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('BAD_REQUEST');
    });
  });

  describe('duplicate detection boundary', () => {
    it('rejects batch with internal duplicate questions', async () => {
      mockBatchDuplicateDetector.findBatchDuplicateDetails.mockReturnValueOnce([
        { index: 1, reason: 'duplicate within batch' }
      ]);

      const response = await makeRequest(validPayload);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('VALIDATION_FAILED');
      expect(data.message).toContain('duplicate');
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).not.toHaveBeenCalled();
    });

    it('rejects batch with questions matching existing bank', async () => {
      mockDuplicateDetector.evaluate.mockResolvedValueOnce({
        status: 'duplicate',
        level: 'high',
        reason: 'exact match',
        signals: { matchedQuestionId: 'existing-123', semanticScore: 0.95 }
      });

      const response = await makeRequest(validPayload);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('VALIDATION_FAILED');
      expect(data.message).toContain('duplicate');
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).not.toHaveBeenCalled();
    });

    it('rejects batch with questions requiring review', async () => {
      mockDuplicateDetector.evaluate.mockResolvedValueOnce({
        status: 'review',
        level: 'medium',
        reason: 'possible match',
        signals: { matchedQuestionId: 'similar-456', semanticScore: 0.75 }
      });

      const response = await makeRequest(validPayload);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('VALIDATION_FAILED');
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).not.toHaveBeenCalled();
    });

    it('accepts batch when all questions are unique', async () => {
      mockDuplicateDetector.evaluate.mockResolvedValue({ status: 'unique' });

      const response = await makeRequest(validPayload);
      expect(response.status).toBe(200);
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('context propagation', () => {
    it('propagates topicId context to engine', async () => {
      await makeRequest(validPayload);
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ topicId: validPayload.topicId })]),
        expect.objectContaining({ topicId: validPayload.topicId }),
        'admin-principal'
      );
    });

    it('propagates subtopicId when provided', async () => {
      const withSubtopic = { ...validPayload, subtopicId: '22222222-2222-4222-8222-222222222222' };
      await makeRequest(withSubtopic);
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ subtopicId: withSubtopic.subtopicId })]),
        expect.objectContaining({ subtopicId: withSubtopic.subtopicId }),
        'admin-principal'
      );
    });

    it('propagates skillIds array when provided', async () => {
      const withSkills = { 
        ...validPayload, 
        skillIds: ['33333333-3333-4333-8333-333333333333'] 
      };
      await makeRequest(withSkills);
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ skillIds: withSkills.skillIds })]),
        expect.objectContaining({ skillIds: withSkills.skillIds }),
        'admin-principal'
      );
    });
  });

  describe('job tracking', () => {
    it('creates job record for tracking bulk import', async () => {
      await makeRequest(validPayload);
      expect(mockJobsService.createJob).toHaveBeenCalledWith({
        userId: 'admin-principal',
        type: 'BULK_IMPORT',
        payload: {
          count: 1,
          context: expect.objectContaining({ topicId: validPayload.topicId })
        }
      });
    });

    it('updates job status on synchronous fallback completion', async () => {
      await makeRequest(validPayload);
      expect(mockJobsService.updateJobStatus).toHaveBeenCalledTimes(2);
      expect(mockJobsService.updateJobStatus).toHaveBeenNthCalledWith(
        1,
        'job-123',
        'processing',
        expect.objectContaining({ currentStep: 'workflow_fallback_sync_insert' })
      );
      expect(mockJobsService.updateJobStatus).toHaveBeenNthCalledWith(
        2,
        'job-123',
        'completed',
        expect.objectContaining({
          result: expect.objectContaining({ mode: 'sync_fallback' })
        })
      );
    });

    it('returns jobId in response', async () => {
      const response = await makeRequest(validPayload);
      const data = await response.json();
      expect(data.jobId).toBe('job-123');
    });
  });

  describe('multiple questions', () => {
    it('processes bulk upload with multiple valid questions', async () => {
      const multipleQuestions = {
        topicId: validPayload.topicId,
        questions: [
          validPayload.questions[0],
          { questionText: 'Question 2', type: 'multi_select', options: ['X', 'Y', 'Z'] },
          { questionText: 'Question 3', type: 'code_mcq', options: [{ code: 'fn()', isCorrect: true }] },
        ]
      };
      mockDuplicateDetector.evaluate.mockResolvedValue({ status: 'unique' });

      const response = await makeRequest(multipleQuestions);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.count).toBe(3);
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ questionText: 'What is 2+2?' }),
          expect.objectContaining({ questionText: 'Question 2' }),
          expect.objectContaining({ questionText: 'Question 3' }),
        ]),
        expect.anything(),
        'admin-principal'
      );
    });

    it('rejects entire batch if any question is invalid', async () => {
      const mixedValidity = {
        topicId: validPayload.topicId,
        questions: [
          validPayload.questions[0],
          { questionText: 'Valid Q2', type: 'mcq', options: ['A'] },
          { questionText: '', type: 'mcq', options: ['A'] }, // Invalid: empty text
        ]
      };

      const response = await makeRequest(mixedValidity);
      expect(response.status).toBe(400);
      expect(mockAdminQuestionEngine.bulkCreateQuestionsWithContext).not.toHaveBeenCalled();
    });
  });
});
