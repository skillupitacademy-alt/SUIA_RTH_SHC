'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { apiClient } from '@quiz/api-client';

export function useDomains() {
    const [data, setData] = useState<any[]>([]);
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

    const create = async (payload: any) => {
        const res = await apiClient.admin.createDomain(payload);
        await fetch();
        return res;
    };

    useEffect(() => { fetch(); }, []);

    return { data, loading, fetch, create };
}

export function useSubjects(domainId?: string) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (!domainId) {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.admin.getSubjects(1, 200, domainId);
            setData(res.data);
        } catch (e) {
            console.error('Fetch subjects failed', e);
        } finally {
            setLoading(false);
        }
    };

    const create = async (payload: any) => {
        const res = await apiClient.admin.createSubject({ ...payload, domainId });
        await fetch();
        return res;
    };

    useEffect(() => { fetch(); }, [domainId]);

    return { data, loading, fetch, create };
}

export function useTopics(subjectId?: string) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (!subjectId) {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.admin.getTopics(1, 500, subjectId);
            setData(res.data);
        } catch (e) {
            console.error('Fetch topics failed', e);
        } finally {
            setLoading(false);
        }
    };

    const create = async (payload: any) => {
        const res = await apiClient.admin.createTopic({ ...payload, subjectId });
        await fetch();
        return res;
    };

    useEffect(() => { fetch(); }, [subjectId]);

    return { data, loading, fetch, create };
}

export function useSubtopics(topicId?: string) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (!topicId) {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.admin.getSubtopics(1, 1000, topicId);
            setData(res.data);
        } catch (e) {
            console.error('Fetch subtopics failed', e);
        } finally {
            setLoading(false);
        }
    };

    const create = async (payload: any) => {
        const res = await apiClient.admin.createSubtopic({ ...payload, topicId });
        await fetch();
        return res;
    };

    useEffect(() => { fetch(); }, [topicId]);

    return { data, loading, fetch, create };
}

export function useAllSkills() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await apiClient.admin.getSkills(1, 2000);
            setData(res.data);
        } catch (e) {
            console.error('Fetch skills failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    return { data, loading, fetch };
}

export function useTopicSkills(topicId?: string) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (!topicId) {
            setData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.admin.getTopicSkills(topicId);
            setData(res);
        } catch (e) {
            console.error('Fetch topic skills failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, [topicId]);

    return { data, loading, fetch };
}
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
