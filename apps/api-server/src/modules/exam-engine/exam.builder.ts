import { container } from '@/modules/core/container';

import { SelectionService } from '../selection-engine/selection.service';
import { ExamRepository } from './repositories/exam.repository';

export interface ExamBuildOptions {
    userId: string;
    blueprintOrDomainId: string;
    idempotencyKey?: string;
    config?: {
        subjectId?: string;
        subjectIds?: string[];
        topicIds?: string[];
        subtopicIds?: string[];
        questionCount?: number;
        difficulty?: string;
    };
}

export class ExamBuilder {
    private userId!: string;
    private blueprintOrDomainId!: string;
    private idempotencyKey?: string;
    private config: ExamBuildOptions['config'] = {};

    private selectionService = container.get(SelectionService);
    private examRepo = container.get(ExamRepository);

    forUser(userId: string): this {
        this.userId = userId;
        return this;
    }

    withBlueprint(id: string): this {
        this.blueprintOrDomainId = id;
        return this;
    }

    withIdempotency(key?: string): this {
        this.idempotencyKey = key;
        return this;
    }

    withConfig(config: ExamBuildOptions['config']): this {
        this.config = { ...this.config, ...config };
        return this;
    }

    async build() {
        if (!this.userId) throw new Error('ExamBuilder: userId is required');
        if (!this.blueprintOrDomainId) throw new Error('ExamBuilder: blueprintOrDomainId is required');
        
        const questionCount = this.config?.questionCount ?? 10;
        if (questionCount <= 0 || questionCount > 100) {
            throw new Error('ExamBuilder: questionCount must be between 1 and 100');
        }

        // 1. Compose the exam (Selection logic)
        const selection = await this.selectionService.composeExam(
            this.userId,
            this.blueprintOrDomainId,
            this.idempotencyKey ?? 'no-key',
            this.config
        );

        if (selection === null || selection === undefined || selection.questions === null || selection.questions === undefined) {
            throw new Error('ExamBuilder: Failed to compose exam');
        }

        if (selection.questions.length === 0) {
            throw new Error('ExamBuilder: Cannot build an exam with 0 questions. Please check your blueprint or configuration.');
        }

        // 2. Persist the exam session
        const exam = await this.examRepo.createExamWithQuestions({
            userId: this.userId,
            blueprintId: selection.blueprint.id === 'transient' ? null : selection.blueprint.id,
            status: 'started',
            durationSeconds: selection.blueprint.timeLimit !== undefined && selection.blueprint.timeLimit !== null
                ? selection.blueprint.timeLimit * 60
                : null,
            questions: selection.questions,
            idempotencyKey: this.idempotencyKey
        });

        return {
            exam,
            questions: selection.questions,
            blueprint: selection.blueprint
        };
    }
}
