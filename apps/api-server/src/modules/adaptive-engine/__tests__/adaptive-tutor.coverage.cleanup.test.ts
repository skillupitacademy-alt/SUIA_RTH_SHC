import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { AdaptiveTutorService } from '../adaptive-tutor.service';
import { UserAnalyticsService } from '../../analytics/user-analytics.service';

vi.mock('../../analytics/user-analytics.service');
vi.mock('@quiz/db', () => ({
    db: {
        query: {
            topics: {
                findMany: vi.fn(),
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

describe('AdaptiveTutorService coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('hits conceptual-gap and performance-dip with fallbacks (Lines 84-86, 94, 101)', async () => {
        const t1 = '11111111-1111-4111-8111-111111111111';
        const t2 = '22222222-2222-4222-8222-222222222222';
        const t3 = '33333333-3333-4333-8333-333333333333';

        vi.mocked(UserAnalyticsService.getTopicPerformance).mockResolvedValue([
            { topicId: t1, accuracy: 90, topicName: 'T1' }, // high past score for t-1
            { topicId: t2, accuracy: 40, topicName: 'T2' }
        ]);

        vi.mocked(db.query.topics.findMany).mockResolvedValue([
            { id: t1, name: '', learningUrl: '' }, // empty name/url for fallback
            { id: t2, name: 'Topic 2', learningUrl: 'http://link' },
            { id: t3, name: 'Topic 3', learningUrl: '' }
        ] as any);

        const records = [
            { topicId: t1, accuracy: 60 }, // current accuracy 60. < 75? Yes. past > 80? Yes (90). -> Performance Dip.
            { topicId: t2, accuracy: 40 }, // current accuracy 40. < 50? Yes. -> Conceptual Gap Found.
            { topicId: t3, accuracy: 78 }  // current accuracy 78. -> Target for Growth.
        ];

        const insights = await AdaptiveTutorService.generateInsights('u-1', records);

        const dip = insights.find(i => i.topicId === t1);
        expect(dip?.label).toBe('Performance Dip');
        expect(dip?.topicName).toBe('Topic');
        expect(dip?.learningUrl).toBeUndefined();

        const gap = insights.find(i => i.topicId === t2);
        expect(gap?.label).toBe('Conceptual Gap Found');

    const growth = insights.find(i => i.topicId === t3);
    expect(growth?.label).toBe('Target for Growth');
  });

  it('returns false in requestMasterNotes when no detailed notes exist (line ~127)', async () => {
    vi.mocked(db.query.topics.findFirst).mockResolvedValue({ id: 't-1', name: 'T1', detailedNotesPath: '' } as any);
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u-1', email: 'user@example.com' } as any);

    const result = await AdaptiveTutorService.requestMasterNotes('u-1', 't-1');
    expect(result).toBe(false);
  });
});
