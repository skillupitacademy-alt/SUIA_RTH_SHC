'use client';

import { apiClient } from '@quiz/api-client';
import { useCallback, useEffect, useState } from 'react';

import { clientLogger } from '@/utils/clientLogger';

import { Domain, Skill, Status, Subject, Subtopic, Topic } from '../types/domain';

export function useDomains() {
    const [data, setData] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getDomains('1', 100);
            const domains: Domain[] = Array.isArray(res.data)
                ? res.data.map((d) => ({
                    id: String(d.id),
                    name: d.name ?? '',
                    description: d.description ?? null,
                    category: d.category ?? null,
                    status: ((d as { status?: Status }).status as Status) ?? 'active',
                    createdAt: d.createdAt ?? undefined,
                    updatedAt: d.updatedAt ?? undefined,
                }))
                : [];
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
            const res = await apiClient.admin.getSkills('1', 2000);
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
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getSubjects('1', 200, domainId);
            const subjects: Subject[] = Array.isArray(res.data)
                ? res.data.map((s) => ({
                    id: String(s.id),
                    name: s.name ?? '',
                    domainId: s.domainId ?? '',
                    description: s.description ?? null,
                    status: ((s as { status?: Status }).status as Status) ?? 'active',
                    order: (s as { order?: number }).order,
                    orderIndex: (s as { orderIndex?: number }).orderIndex,
                    createdAt: (s as { createdAt?: string }).createdAt,
                    updatedAt: (s as { updatedAt?: string }).updatedAt,
                }))
                : [];
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
            const res = await apiClient.admin.getTopics('1', 500, subjectId);
            const topics: Topic[] = Array.isArray(res.data)
                ? res.data.map((t) => ({
                    id: String(t.id),
                    name: t.name ?? '',
                    subjectId: t.subjectId ?? '',
                    description: t.description ?? null,
                    status: ((t as { status?: Status }).status as Status) ?? 'active',
                    weight: (t as { weight?: number }).weight ?? 0,
                    complexityLevel: (t as { complexityLevel?: number }).complexityLevel ?? (t as { complexity?: number }).complexity ?? 0,
                    learningUrl: (t as { learningUrl?: string }).learningUrl,
                    detailedNotesPath: (t as { detailedNotesPath?: string }).detailedNotesPath,
                    subject: (t as { subject?: Topic['subject'] }).subject,
                }))
                : [];
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
            const res = await apiClient.admin.getSubtopics('1', 1000, topicId);
            setData(res.data as Subtopic[]);
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
