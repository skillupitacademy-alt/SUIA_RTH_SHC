import { Job, JobStatus, JobType } from '@quiz/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';

import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { JobsService } from '@/modules/system/jobs.service';

// Mock the services
vi.mock('@/modules/system/jobs.service');
vi.mock('@/modules/scoring-engine/scoring.engine');

describe('JobOrchestrator - handleExamScoring', () => {
    const mockJobId = 'job-123';
    const mockUserId = 'user-456';
    const mockExamId = 'exam-789';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should transition job status to COMPLETED after successful scoring', async () => {
        // Arrange
        const mockJob: Job = {
            id: mockJobId,
            userId: mockUserId,
            type: JobType.EXAM_SCORING,
            status: JobStatus.PENDING,
            payload: { examId: mockExamId },
            createdAt: new Date().toISOString()
        };

        vi.mocked(JobsService.getJob).mockResolvedValue(mockJob);
        vi.mocked(ScoringEngine.calculateExamResults).mockResolvedValue(85); // Mock return score

        // Act
        await JobOrchestrator.runJob(mockJobId, mockUserId);

        // Assert
        // 1. Should have marked as processing first
        expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
            mockJobId, 
            JobStatus.PROCESSING
        );

        // 2. Should have calculated results
        expect(ScoringEngine.calculateExamResults).toHaveBeenCalledWith(mockExamId);

        // 3. Should have marked as completed with results
        expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
            mockJobId,
            JobStatus.COMPLETED,
            expect.objectContaining({
                result: expect.objectContaining({
                    examId: mockExamId,
                    finalScore: 85
                })
            })
        );
    });

    it('should transition job status to FAILED if scoring engine throws', async () => {
        // Arrange
        const mockJob: Job = {
            id: mockJobId,
            userId: mockUserId,
            type: JobType.EXAM_SCORING,
            status: JobStatus.PENDING,
            payload: { examId: mockExamId },
            createdAt: new Date().toISOString()
        };

        const errorMsg = 'Database connection failed';
        vi.mocked(JobsService.getJob).mockResolvedValue(mockJob);
        vi.mocked(ScoringEngine.calculateExamResults).mockRejectedValue(new Error(errorMsg));

        // Act
        await JobOrchestrator.runJob(mockJobId, mockUserId);

        // Assert
        // 1. Should have marked as processing first
        expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
            mockJobId, 
            JobStatus.PROCESSING
        );

        // 2. Should have caught the error and marked as failed
        expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
            mockJobId,
            JobStatus.FAILED,
            expect.objectContaining({
                error: errorMsg
            })
        );
    });

    it('should skip execution if job is already processing', async () => {
        // Arrange
        const mockJob: Job = {
            id: mockJobId,
            userId: mockUserId,
            type: JobType.EXAM_SCORING,
            status: JobStatus.PROCESSING, // Already processing
            payload: { examId: mockExamId },
            createdAt: new Date().toISOString()
        };

        vi.mocked(JobsService.getJob).mockResolvedValue(mockJob);

        // Act
        await JobOrchestrator.runJob(mockJobId, mockUserId);

        // Assert
        expect(JobsService.updateJobStatus).not.toHaveBeenCalled();
        expect(ScoringEngine.calculateExamResults).not.toHaveBeenCalled();
    });

    it('should throw error if mission examId in payload', async () => {
        // Arrange
        const mockJob: Job = {
            id: mockJobId,
            userId: mockUserId,
            type: JobType.EXAM_SCORING,
            status: JobStatus.PENDING,
            payload: {}, // Missing examId
            createdAt: new Date().toISOString()
        };

        vi.mocked(JobsService.getJob).mockResolvedValue(mockJob);

        // Act
        await JobOrchestrator.runJob(mockJobId, mockUserId);

        // Assert
        expect(JobsService.updateJobStatus).toHaveBeenCalledWith(
            mockJobId,
            JobStatus.FAILED,
            expect.objectContaining({
                error: 'Missing examId in payload'
            })
        );
    });
});
