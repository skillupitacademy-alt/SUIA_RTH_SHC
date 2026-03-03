import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { AdaptiveTutorService } from '../adaptive-tutor.service';
import { UserAnalyticsService } from '../../analytics/user-analytics.service';

vi.mock('../../analytics/user-analytics.service', () => ({
    UserAnalyticsService: {
        getTopicPerformance: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            topics: {
                findFirst: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            }
        },
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined)
        })
    },
    topics: { id: 'id', name: 'name' },
    notifications: { id: 'id', userId: 'userId' },
    users: { id: 'id', email: 'email' }
}));

describe('AdaptiveTutorService generateInsights tail coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('generateInsights returns empty when no topics have < 80 accuracy (Line 35)', async () => {
        // Provide mock data that bypasses historical db but doesn't really matter we just need topicAccuracyRecords to all have >= 80
        const result = await AdaptiveTutorService.generateInsights('u-1', [
            { topicId: 't-1', accuracy: 85 },
            { topicId: 't-2', accuracy: 90 }
        ]);
        expect(result).toEqual([]);
    });
});

describe('AdaptiveTutorService requestMasterNotes tail coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requestMasterNotes: covers line 127 (where) and email success branch', async () => {
        vi.mocked(db.query.topics.findFirst).mockResolvedValue({ id: 't-1', name: 'T1', detailedNotesPath: 'path/to/notes' } as any);
        
        let capturedWhereCallback: any = null;
        const mockFn = vi.fn().mockImplementation((opts: any) => {
            if (opts?.where) capturedWhereCallback = opts.where;
            return Promise.resolve({ id: 'u-1', email: 'user@example.com' } as any);
        });
        db.query.users.findFirst = mockFn as any;

        const result = await AdaptiveTutorService.requestMasterNotes('u-1', 't-1');
        
        // Execute the where callback to cover line 127
        if (capturedWhereCallback) {
            const mockU = { id: 'u-1' };
            const mockOperators = { eq: vi.fn() };
            capturedWhereCallback(mockU, mockOperators);
            expect(mockOperators.eq).toHaveBeenCalledWith('u-1', 'u-1');
        }

        expect(result).toBe(true);
        expect(db.query.users.findFirst).toHaveBeenCalled();
        expect(db.insert).toHaveBeenCalled();
    });

    it('requestMasterNotes: covers email fallback branch (no email)', async () => {
        vi.mocked(db.query.topics.findFirst).mockResolvedValue({ id: 't-1', name: 'T1', detailedNotesPath: 'path/to/notes' } as any);
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u-1', email: '' } as any);

        const result = await AdaptiveTutorService.requestMasterNotes('u-1', 't-1');
        expect(result).toBe(true);
        expect(db.insert).toHaveBeenCalled();
    });

    it('requestMasterNotes: handles user not found (email fallback)', async () => {
        vi.mocked(db.query.topics.findFirst).mockResolvedValue({ id: 't-1', name: 'T1', detailedNotesPath: 'path/to/notes' } as any);
        vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

        const result = await AdaptiveTutorService.requestMasterNotes('u-1', 't-1');
        expect(result).toBe(true); // Still sends notification even if user record missing for some reason
        expect(db.insert).toHaveBeenCalled();
    });
});
