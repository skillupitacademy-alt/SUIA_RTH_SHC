import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { DrizzleAdminAnalyticsRepository } from '../drizzle-admin-analytics.repository';

describe('Repository: Admin Analytics Materialized Views (Task 113)', () => {
    let repository: DrizzleAdminAnalyticsRepository;
    const mockDb = {
        execute: vi.fn(),
        query: {
            auditLogs: { findMany: vi.fn() },
            domains: { findMany: vi.fn() }
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                leftJoin: vi.fn(() => ({
                    groupBy: vi.fn(() => ({
                        orderBy: vi.fn().mockResolvedValue([])
                    }))
                }))
            }))
        }))
    };

    beforeEach(() => {
        vi.clearAllMocks();
        repository = new DrizzleAdminAnalyticsRepository(mockDb as any);
    });

    it('should query mv_user_stats and mv_exam_stats for platform metrics', async () => {
        mockDb.execute
            .mockResolvedValueOnce({ rows: [{ total_users: "100", active_users_24h: "10", total_domains: "5" }] })
            .mockResolvedValueOnce({ rows: [{ total_exams: "50" }] });

        const result = await repository.getPlatformMetrics();

        expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('mv_user_stats'));
        expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('mv_exam_stats'));
        expect(result.totalUsers).toBe(100);
        expect(result.activeUsers24h).toBe(10);
    });

    it('should query efficiency stats from mv_efficiency_stats', async () => {
        mockDb.execute.mockResolvedValueOnce({ 
            rows: [{ quadrant: 'mastery', count: 20 }, { quadrant: 'struggle', count: 5 }] 
        });

        const result = await repository.getEfficiencyAnalytics();

        expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('mv_efficiency_stats'));
        expect(result).toContainEqual({ quadrant: 'mastery', count: 20 });
    });
});
