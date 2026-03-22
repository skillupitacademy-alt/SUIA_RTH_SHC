'use client';

import { apiClient } from '@quiz/api-client';
import { useCallback, useEffect, useState } from 'react';

import { clientLogger } from '@/utils/clientLogger';

import { Domain, Skill, Status, Subject, Subtopic, Topic } from '../types/domain';

type HierarchyResponse<T> = {
    data?: T[];
    error?: string;
};

async function loadHierarchy<T>(url: string, mapper: (item: Record<string, unknown>) => T, fallbackError: string): Promise<T[]> {
    const response = await fetch(url);
    const payload = await response.json().catch(() => null) as HierarchyResponse<Record<string, unknown>> | null;

    if (!response.ok) {
        throw new Error(payload?.error ?? fallbackError);
    }

    if (Array.isArray(payload?.data) === false) {
        return [];
    }

    return payload.data.map((item) => mapper(item));
}

export function useDomains() {
    const [data, setData] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const domains = await loadHierarchy('/api/tutorial/hierarchy/domains', (domain) => ({
                id: String(domain.id ?? ''),
                name: String(domain.name ?? ''),
                slug: String(domain.slug ?? ''),
                description: null,
                category: null,
                status: 'active' as Status,
                createdAt: typeof domain.createdAt === 'string' ? domain.createdAt : undefined,
                updatedAt: typeof domain.updatedAt === 'string' ? domain.updatedAt : undefined,
                externalId: String(domain.externalId ?? ''),
            }), 'Unable to load domains.');
            setData(domains);
        } catch (e) {
            clientLogger.error('Fetch domains failed', { error: e instanceof Error ? e.message : 'unknown' });
            setError('Unable to load domains.');
        } finally {
            setLoading(false);
        }
    }, []);

    const create = async (payload: Partial<Domain>) => {
        const res = await apiClient.admin.createDomain({
            name: payload.name ?? '',
            slug: (payload as { slug?: string }).slug ?? payload.name ?? 'domain',
            description: payload.description ?? undefined,
            icon: (payload as { icon?: string }).icon
        });
        await fetch();
        return res;
    };

    useEffect(() => { void fetch(); }, [fetch]);

    return { data, loading, error, fetch, create };
}

export function useTopicSkills(topicId?: string) {
    const [data, setData] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (topicId === undefined || topicId === null || topicId === '') {
            setData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getTopicSkills(topicId);
            setData(Array.isArray(res) ? res as Skill[] : []);
        } catch (e) {
            clientLogger.error('Fetch topic skills failed', { error: e instanceof Error ? e.message : 'unknown' });
            setError('Unable to load topic skills.');
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    useEffect(() => { void fetch(); }, [fetch]);

    return { data, loading, error, fetch };
}

export function useAllSkills() {
    const [data, setData] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getSkills(null, 2000);
            setData(res.data as Skill[]);
        } catch (e) {
            clientLogger.error('Fetch skills failed', { error: e instanceof Error ? e.message : 'unknown' });
            setError('Unable to load skills.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetch(); }, [fetch]);

    return { data, loading, error, fetch };
}

export function useSubjects(domainId?: string) {
    const [data, setData] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (domainId === undefined || domainId === null || domainId === '') {
            setData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const subjects = await loadHierarchy(
                `/api/tutorial/hierarchy/subjects?domainId=${encodeURIComponent(domainId ?? '')}`,
                (subject) => ({
                    id: String(subject.id ?? ''),
                    name: String(subject.name ?? ''),
                    slug: String(subject.slug ?? ''),
                    domainId: String(subject.domainId ?? ''),
                    description: null,
                    status: 'active' as Status,
                    order: undefined,
                    orderIndex: undefined,
                    createdAt: typeof subject.createdAt === 'string' ? subject.createdAt : undefined,
                    updatedAt: typeof subject.updatedAt === 'string' ? subject.updatedAt : undefined,
                    externalId: String(subject.externalId ?? ''),
                }),
                'Unable to load subjects.'
            );
            setData(subjects);
        } catch (e) {
            clientLogger.error('Fetch subjects failed', { error: e instanceof Error ? e.message : 'unknown' });
            setError('Unable to load subjects.');
        } finally {
            setLoading(false);
        }
    }, [domainId]);

    const create = async (payload: Partial<Subject>) => {
        const res = await apiClient.admin.createSubject({
            name: payload.name ?? '',
            domainId: domainId ?? '',
            slug: (payload as { slug?: string }).slug,
            description: payload.description ?? undefined,
            icon: (payload as { icon?: string }).icon,
            orderIndex: payload.orderIndex
        });
        await fetch();
        return res;
    };

    useEffect(() => { void fetch(); }, [domainId, fetch]);

    return { data, loading, error, fetch, create };
}

export function useTopics(subjectId?: string) {
    const [data, setData] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (subjectId === undefined || subjectId === null || subjectId === '') {
            setData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const topics = await loadHierarchy(
                `/api/tutorial/hierarchy/topics?subjectId=${encodeURIComponent(subjectId)}`,
                (topic) => ({
                    id: String(topic.id ?? ''),
                    name: String(topic.name ?? ''),
                    slug: String(topic.slug ?? ''),
                    subjectId: String(topic.subjectId ?? ''),
                    description: null,
                    status: 'active' as Status,
                    weight: 0,
                    complexityLevel: 0,
                    learningUrl: undefined,
                    detailedNotesPath: undefined,
                    subject: undefined,
                    createdAt: typeof topic.createdAt === 'string' ? topic.createdAt : undefined,
                    updatedAt: typeof topic.updatedAt === 'string' ? topic.updatedAt : undefined,
                    externalId: String(topic.externalId ?? ''),
                }),
                'Unable to load topics.'
            );
            setData(topics);
        } catch (e) {
            clientLogger.error('Fetch topics failed', { error: e instanceof Error ? e.message : 'unknown' });
            setError('Unable to load topics.');
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    const create = async (payload: Partial<Topic>) => {
        const res = await apiClient.admin.createTopic({
            name: payload.name ?? '',
            subjectId: subjectId ?? '',
            slug: (payload as { slug?: string }).slug,
            description: payload.description ?? undefined,
            orderIndex: payload.orderIndex,
            complexity: (payload as { complexity?: 'beginner' | 'intermediate' | 'advanced' }).complexity
        });
        await fetch();
        return res;
    };

    useEffect(() => { void fetch(); }, [subjectId, fetch]);

    return { data, loading, error, fetch, create };
}

export function useSubtopics(topicId?: string) {
    const [data, setData] = useState<Subtopic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (topicId === undefined || topicId === null || topicId === '') {
            setData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const subtopics = await loadHierarchy(
                `/api/tutorial/hierarchy/subtopics?topicId=${encodeURIComponent(topicId)}`,
                (subtopic) => ({
                    id: String(subtopic.id ?? ''),
                    name: String(subtopic.name ?? ''),
                    slug: String(subtopic.slug ?? ''),
                    topicId: String(subtopic.topicId ?? ''),
                    description: null,
                    depthLevel: undefined,
                    orderIndex: undefined,
                    status: 'active' as Status,
                    createdAt: typeof subtopic.createdAt === 'string' ? subtopic.createdAt : undefined,
                    updatedAt: typeof subtopic.updatedAt === 'string' ? subtopic.updatedAt : undefined,
                    externalId: String(subtopic.externalId ?? ''),
                    difficultyLevels: Array.isArray(subtopic.difficultyLevels) ? subtopic.difficultyLevels : [],
                }),
                'Unable to load subtopics.'
            );
            setData(subtopics as Subtopic[]);
        } catch (e) {
            clientLogger.error('Fetch subtopics failed', { error: e instanceof Error ? e.message : 'unknown' });
            setError('Unable to load subtopics.');
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    const create = async (payload: Partial<Subtopic>) => {
        const res = await apiClient.admin.createSubtopic({
            name: payload.name ?? '',
            topicId: topicId ?? '',
            slug: (payload as { slug?: string }).slug,
            description: payload.description ?? undefined,
            orderIndex: payload.orderIndex
        });
        await fetch();
        return res;
    };

    useEffect(() => { void fetch(); }, [fetch]);

    return { data, loading, error, fetch, create };
}
