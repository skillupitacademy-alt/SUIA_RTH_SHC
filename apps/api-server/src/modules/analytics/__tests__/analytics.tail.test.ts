import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { sql } from '@/lib/db';
import { AnalyticsService } from '../analytics.service';
import { UserAnalyticsService } from '../user-analytics.service';

vi.mock('@quiz/db', () => ({
    db: {
        execute: vi.fn()
    }
}));

vi.mock('@/lib/db', () => ({
    sql: vi.fn()
}));

// Mock logger to avoid noisy output
vi.mock('@/lib/logger', () => ({
    logger: {
        child: () => ({
            info: vi.fn(),
            debug: vi.fn(),
            error: vi.fn()
        })
    }
}));

// Provide a minimally viable redis mock if user-analytics tries to use it
vi.mock('@/lib/redis', () => ({
    redis: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK')
    }
}));

describe('Analytics services tail coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('AnalyticsService: refreshAllViews catches non-Error objects (Line 49)', async () => {
        // Force the first view refresh to throw a string instead of an Error object
        vi.mocked(db.execute).mockRejectedValueOnce('Some string error');
        // Other views will succeed or we can just mock the rest to resolve
        vi.mocked(db.execute).mockResolvedValue(undefined as any);

        await expect(AnalyticsService.refreshAllViews()).rejects.toThrow(/Failed to refresh/);
    });

    it('UserAnalyticsService: getTopicPerformance handles null accuracy (Line 76)', async () => {
        vi.mocked(sql).mockResolvedValue([
            { topicId: 't-1', topicName: 'Topic 1', accuracy: null }
        ] as any);

        const result = await UserAnalyticsService.getTopicPerformance('u-1');
        expect(result[0].accuracy).toBe(0);
    });
});
