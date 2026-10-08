import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdminUserEngine } from '../admin.user.engine';
import { AdminQuestionEngine } from '../admin.question.engine';

describe('Admin Keyset Pagination Logic (T98)', () => {
    const mockAudit = { log: vi.fn() };

    describe('AdminUserEngine Pagination', () => {
        const mockRepo = {
            findAll: vi.fn(),
            softDelete: vi.fn(),
        };
        const engine = new AdminUserEngine(mockRepo as any, mockAudit as any);

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should fetch users using cursor and return nextCursor', async () => {
            const mockDate = new Date().toISOString();
            mockRepo.findAll.mockResolvedValue({
                users: [{ id: 'u1', createdAt: new Date(), isBlocked: false, lastActiveAt: new Date() }],
                total: 100,
                nextCursor: mockDate,
                limit: 10
            });

            const result = await engine.getUsers(null, 10);

            expect(mockRepo.findAll).toHaveBeenCalledWith(null, 10, 'active', undefined);
            expect(result).toEqual({
                users: expect.any(Array),
                total: 100,
                nextCursor: mockDate,
                limit: 10
            });
        });

        it('should pass filters and cursor to repository', async () => {
            const cursor = 'v1-timestamp';
            await engine.getUsers(cursor, 20, 'active', { search: 'test' });

            expect(mockRepo.findAll).toHaveBeenCalledWith(cursor, 20, 'active', expect.objectContaining({ search: 'test' }));
        });
    });

    describe('AdminQuestionEngine Pagination', () => {
        const mockRepo = {
            findAll: vi.fn(),
        };
        const engine = new AdminQuestionEngine(mockRepo as any, mockAudit as any);

        it('should fetch questions using cursor and return nextCursor', async () => {
            const mockDate = new Date().toISOString();
            mockRepo.findAll.mockResolvedValue({
                data: [{ id: 'q1', updatedAt: new Date() }],
                total: 50,
                nextCursor: mockDate,
                limit: 5
            });

            const result = await engine.getQuestions(null, 5);

            expect(mockRepo.findAll).toHaveBeenCalledWith(null, 5, undefined);
            expect(result).toEqual({
                questions: expect.any(Array),
                total: 50,
                nextCursor: mockDate,
                limit: 5
            });
        });
    });
});
