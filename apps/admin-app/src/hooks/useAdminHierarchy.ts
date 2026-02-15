'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { apiClient } from '@quiz/api-client';
import { useEffect, useState } from 'react';

import { Domain, Skill, Subject, Subtopic, Topic } from '../types/domain';

export function useDomains() {
    const [data, setData] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await apiClient.admin.getDomains(1, 100);
            setData(res.data);
        } catch (e) {
            console.error('Fetch domains failed', e);
        } finally {
            setLoading(false);
        }
    };

    const create = async (payload: Partial<Domain>) => {
        const res = await apiClient.admin.createDomain(payload);
        await fetch();
        return res;
    };

    useEffect(() => { void fetch(); }, []);

    return { data, loading, fetch, create };
}

export function useSubjects(domainId?: string) {
    const [data, setData] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (domainId === undefined || domainId === null || domainId === '') {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.admin.getSubjects(1, 200, domainId);
            setData(res.data as Subject[]);
        } catch (e) {
            console.error('Fetch subjects failed', e);
        } finally {
            setLoading(false);
        }
    };

    const create = async (payload: Partial<Subject>) => {
        const res = await apiClient.admin.createSubject({ ...payload, domainId });
        await fetch();
        return res;
    };

    useEffect(() => { void fetch(); }, [domainId]);

    return { data, loading, fetch, create };
}

export function useTopics(subjectId?: string) {
    const [data, setData] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (subjectId === undefined || subjectId === null || subjectId === '') {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.admin.getTopics(1, 500, subjectId);
            setData(res.data as Topic[]);
        } catch (e) {
            console.error('Fetch topics failed', e);
        } finally {
            setLoading(false);
        }
    };

    const create = async (payload: Partial<Topic>) => {
        const res = await apiClient.admin.createTopic({ ...payload, subjectId });
        await fetch();
        return res;
    };

    useEffect(() => { void fetch(); }, [subjectId]);

    return { data, loading, fetch, create };
}

export function useSubtopics(topicId?: string) {
    const [data, setData] = useState<Subtopic[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (topicId === undefined || topicId === null || topicId === '') {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.admin.getSubtopics(1, 1000, topicId);
            setData(res.data as Subtopic[]);
        } catch (e) {
            console.error('Fetch subtopics failed', e);
        } finally {
            setLoading(false);
        }
    };

    const create = async (payload: Partial<Subtopic>) => {
        const res = await apiClient.admin.createSubtopic({ ...payload, topicId });
        await fetch();
        return res;
    };

    useEffect(() => { void fetch(); }, [topicId]);

    return { data, loading, fetch, create };
}

export function useAllSkills() {
    const [data, setData] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await apiClient.admin.getSkills(1, 2000);
            setData(res.data as Skill[]);
        } catch (e) {
            console.error('Fetch skills failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void fetch(); }, []);

    return { data, loading, fetch };
}

export function useTopicSkills(topicId?: string) {
    const [data, setData] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (topicId === undefined || topicId === null || topicId === '') {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.admin.getTopicSkills(topicId);
            setData(res as Skill[]);
        } catch (e) {
            console.error('Fetch topic skills failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void fetch(); }, [topicId]);

    return { data, loading, fetch };
}
/* eslint-disable react-hooks/exhaustive-deps */
