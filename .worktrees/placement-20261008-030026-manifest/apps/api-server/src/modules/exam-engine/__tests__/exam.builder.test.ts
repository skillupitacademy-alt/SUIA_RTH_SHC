import { beforeAll, describe, expect, it, vi } from 'vitest';
import { container } from '@/modules/core/container';
import { SelectionService } from '../../selection-engine/selection.service';
import { ExamRepository } from '../repositories/exam.repository';
import { ExamBuilder } from '../exam.builder';

describe('ExamBuilder', () => {
    const mockSelectionService = {
        composeExam: vi.fn()
    };
    const mockExamRepo = {
        createExamWithQuestions: vi.fn()
    };

    beforeAll(() => {
        container.register(SelectionService, mockSelectionService as any);
        container.register(ExamRepository, mockExamRepo as any);
    });

    it('should throw if userId is missing', async () => {
        const builder = new ExamBuilder();
        await expect(builder.withBlueprint('b1').build()).rejects.toThrow('ExamBuilder: userId is required');
    });

    it('should throw if blueprintId is missing', async () => {
        const builder = new ExamBuilder();
        await expect(builder.forUser('u1').build()).rejects.toThrow('ExamBuilder: blueprintOrDomainId is required');
    });

    it('should throw for invalid questionCount', async () => {
        const builder = new ExamBuilder();
        await expect(builder.forUser('u1').withBlueprint('b1').withConfig({ questionCount: 0 }).build())
            .rejects.toThrow('ExamBuilder: questionCount must be between 1 and 100');
    });

    it('should call selection service and repo to build exam', async () => {
        const questions = [{ id: 'q1' }];
        const blueprint = { id: 'b1', timeLimit: 10 };
        mockSelectionService.composeExam.mockResolvedValue({ questions, blueprint });
        mockExamRepo.createExamWithQuestions.mockResolvedValue({ id: 'e1' });

        const builder = new ExamBuilder();
        const result = await builder
            .forUser('u1')
            .withBlueprint('b1')
            .withIdempotency('k1')
            .build();

        expect(mockSelectionService.composeExam).toHaveBeenCalledWith('u1', 'b1', 'k1', {});
        expect(mockExamRepo.createExamWithQuestions).toHaveBeenCalled();
        expect(result.exam.id).toBe('e1');
    });
});
