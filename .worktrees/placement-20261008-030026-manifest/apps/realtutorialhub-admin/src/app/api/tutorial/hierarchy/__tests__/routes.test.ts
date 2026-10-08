import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as getDomains } from '../domains/route';
import { GET as getSubjects } from '../subjects/route';
import { GET as getSubtopics } from '../subtopics/route';
import { GET as getTopics } from '../topics/route';

const adminId = crypto.randomUUID();
const domainId = crypto.randomUUID();
const subjectId = crypto.randomUUID();
const topicId = crypto.randomUUID();
const domainExternalId = crypto.randomUUID();
const subjectExternalId = crypto.randomUUID();
const topicExternalId = crypto.randomUUID();
const subtopicExternalId = crypto.randomUUID();

const domains = [
    {
        id: domainId,
        externalId: domainExternalId,
        name: 'Full Stack Development',
        slug: 'full-stack-development',
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
];

const subjects = [
    {
        id: subjectId,
        externalId: subjectExternalId,
        domainId,
        name: 'JavaScript',
        slug: 'javascript',
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
];

const topics = [
    {
        id: topicId,
        externalId: topicExternalId,
        subjectId,
        name: 'Async Programming',
        slug: 'async-programming',
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
];

const subtopics = [
    {
        id: crypto.randomUUID(),
        externalId: subtopicExternalId,
        topicId,
        name: 'JavaScript Promises',
        slug: 'javascript-promises',
        difficultyLevels: ['simple', 'mixed', 'intermediate', 'expert'],
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
];

const mocks = vi.hoisted(() => {
    const dbMock = {
        select: vi.fn(() => ({
            from: vi.fn((table: unknown) => {
                if (table === mocks.tables.tutorialDomains) return Promise.resolve(domains);
                if (table === mocks.tables.tutorialSubjects) return Promise.resolve(subjects);
                if (table === mocks.tables.tutorialTopics) return Promise.resolve(topics);
                if (table === mocks.tables.tutorialSubtopics) return Promise.resolve(subtopics);
                return Promise.resolve([]);
            }),
        })),
    };

    return {
        dbMock,
        tables: {
            tutorialDomains: { kind: 'domain' },
            tutorialSubjects: { kind: 'subject' },
            tutorialTopics: { kind: 'topic' },
            tutorialSubtopics: { kind: 'subtopic' },
        },
        requireAdmin: vi.fn(),
        isTutorialAuthError: (error: unknown) => error instanceof Error && 'statusCode' in error,
    };
});

vi.mock('@/lib/tutorial-content-api', () => ({
    requireAdmin: mocks.requireAdmin,
    isTutorialAuthError: mocks.isTutorialAuthError,
    logRouteError: vi.fn(),
}));

vi.mock('@quiz/db-tutorial', () => ({
    db: mocks.dbMock,
    tutorialDomains: mocks.tables.tutorialDomains,
    tutorialSubjects: mocks.tables.tutorialSubjects,
    tutorialTopics: mocks.tables.tutorialTopics,
    tutorialSubtopics: mocks.tables.tutorialSubtopics,
}));

function makeRequest(path: string) {
    return new NextRequest(`http://localhost${path}`, { method: 'GET' });
}

describe('tutorial hierarchy routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: adminId, roles: ['ADMIN'], isAdmin: true });
    });

    it('returns domains for admins', async () => {
        const response = await getDomains(makeRequest('/api/tutorial/hierarchy/domains'));

        expect(response.status).toBe(200);
        const payload = await response.json() as { data: Array<{ id: string }> };
        expect(payload.data).toHaveLength(1);
        expect(payload.data[0]?.id).toBe(domainId);
    });

    it('returns 401 when domain auth is missing', async () => {
        mocks.requireAdmin.mockRejectedValueOnce(new Error('Unauthorized'));

        const response = await getDomains(makeRequest('/api/tutorial/hierarchy/domains'));

        expect(response.status).toBe(401);
    });

    it('returns subjects filtered by domain', async () => {
        const response = await getSubjects(makeRequest(`/api/tutorial/hierarchy/subjects?domainId=${domainId}`));

        expect(response.status).toBe(200);
        const payload = await response.json() as { data: Array<{ domainId: string }> };
        expect(payload.data).toHaveLength(1);
        expect(payload.data[0]?.domainId).toBe(domainId);
    });

    it('returns topics filtered by subject', async () => {
        const response = await getTopics(makeRequest(`/api/tutorial/hierarchy/topics?subjectId=${subjectId}`));

        expect(response.status).toBe(200);
        const payload = await response.json() as { data: Array<{ subjectId: string }> };
        expect(payload.data).toHaveLength(1);
        expect(payload.data[0]?.subjectId).toBe(subjectId);
    });

    it('returns subtopics filtered by topic', async () => {
        const response = await getSubtopics(makeRequest(`/api/tutorial/hierarchy/subtopics?topicId=${topicId}`));

        expect(response.status).toBe(200);
        const payload = await response.json() as { data: Array<{ topicId: string; difficultyLevels: string[] }> };
        expect(payload.data).toHaveLength(1);
        expect(payload.data[0]?.topicId).toBe(topicId);
        expect(payload.data[0]?.difficultyLevels).toEqual(['simple', 'mixed', 'intermediate', 'expert']);
    });

    it('returns 400 for invalid query params', async () => {
        const response = await getSubjects(makeRequest('/api/tutorial/hierarchy/subjects?domainId=invalid'));

        expect(response.status).toBe(400);
    });
});
