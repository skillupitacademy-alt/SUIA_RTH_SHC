import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@quiz/api-client';
import { useAuthStore } from '@/store/auth-store';

interface HierarchyHookResult<T> {
    data: T[];
    total: number;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    create: (data: any) => Promise<T>;
}

export function useDomains(initialFetch = true): HierarchyHookResult<any> {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuthStore();

    const fetch = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getDomains(1, 100); 
            setData(res.data);
            setTotal(res.total);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch domains');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const create = async (newItem: any) => {
        if (!token) return;
        try {
            const res = await apiClient.admin.createDomain(newItem);
            await fetch();
            return res;
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    useEffect(() => {
        if (initialFetch && token) fetch();
    }, [fetch, initialFetch, token]);

    return { data, total, loading, error, refetch: fetch, create };
}

export function useSubjects(domainId?: string): HierarchyHookResult<any> {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuthStore();

    const fetch = useCallback(async () => {
        if (!domainId || !token) {
            setData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getSubjects(1, 100, domainId);
            setData(res.data);
            setTotal(res.total);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch subjects');
        } finally {
            setLoading(false);
        }
    }, [domainId, token]);

    const create = async (newItem: any) => {
        if (!token) return;
        try {
            const res = await apiClient.admin.createSubject({ ...newItem, domainId });
            await fetch();
            return res;
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    useEffect(() => {
        if (token) fetch();
    }, [fetch, token]);

    return { data, total, loading, error, refetch: fetch, create };
}

export function useTopics(subjectId?: string): HierarchyHookResult<any> {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuthStore();

    const fetch = useCallback(async () => {
        if (!subjectId || !token) {
            setData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getTopics(1, 100, subjectId);
            setData(res.data);
            setTotal(res.total);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch topics');
        } finally {
            setLoading(false);
        }
    }, [subjectId, token]);

    const create = async (newItem: any) => {
        if (!token) return;
        try {
            const res = await apiClient.admin.createTopic({ ...newItem, subjectId });
            await fetch();
            return res;
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    useEffect(() => {
        if (token) fetch();
    }, [fetch, token]);

    return { data, total, loading, error, refetch: fetch, create };
}

export function useSubtopics(topicId?: string): HierarchyHookResult<any> {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuthStore();

    const fetch = useCallback(async () => {
        if (!topicId || !token) {
            setData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getSubtopics(1, 100, topicId);
            setData(res.data);
            setTotal(res.total);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch subtopics');
        } finally {
            setLoading(false);
        }
    }, [topicId, token]);

    const create = async (newItem: any) => {
        if (!token) return;
        try {
            const res = await apiClient.admin.createSubtopic({ ...newItem, topicId });
            await fetch();
            return res;
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    useEffect(() => {
        if (token) fetch();
    }, [fetch, token]);

    return { data, total, loading, error, refetch: fetch, create };
}

export function useTopicSkills(topicId?: string): { data: any[], loading: boolean, error: string | null } {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuthStore();

    const fetch = useCallback(async () => {
        if (!topicId || !token) {
            setData([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.admin.getTopicSkills(topicId);
            setData(res);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch topic skills');
        } finally {
            setLoading(false);
        }
    }, [topicId, token]);

    useEffect(() => {
        if (token) fetch();
    }, [fetch, token]);

    return { data, loading, error };
}

export function useAllSkills(): { data: any[], loading: boolean, error: string | null } {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuthStore();

    const fetch = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            // Fetching page 1 with a large limit to get all skills for the dropdown
            const res = await apiClient.admin.getSkills(1, 1000);
            setData(res.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch skills');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetch();
    }, [fetch, token]);

    return { data, loading, error };
}
