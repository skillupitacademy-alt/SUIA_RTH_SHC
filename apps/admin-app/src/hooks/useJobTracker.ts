"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import type { BackgroundJob } from '@quiz/api-client';

const POLL_INTERVAL = 5000; // 5 seconds
const LOCAL_STORAGE_KEY = 'admin-active-jobs';

export function useJobTracker() {
    const { user, isAuthenticated, initialized } = useAuthStore();
    const [jobs, setJobs] = useState<BackgroundJob[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Load active job IDs from localStorage for the current user
    const getStoredJobIds = useCallback((): string[] => {
        if (typeof window === 'undefined' || !user?.id) return [];
        const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}-${user.id}`);
        if (!stored) return [];
        try {
            return JSON.parse(stored) as string[];
        } catch {
            return [];
        }
    }, [user?.id]);

    const saveStoredJobIds = useCallback((ids: string[]) => {
        if (typeof window === 'undefined' || !user?.id) return;
        localStorage.setItem(`${LOCAL_STORAGE_KEY}-${user.id}`, JSON.stringify(ids));
    }, [user?.id]);

    // 2. Poll status for all tracked jobs
    const checkJobsStatus = useCallback(async () => {
        if (!isAuthenticated || !user?.id) return;

        const jobIds = getStoredJobIds();
        if (jobIds.length === 0) {
            setJobs([]);
            return;
        }

        try {
            const results = await Promise.all(
                jobIds.map(async (id) => {
                    try {
                        return await apiClient.admin.getJobById(id);
                    } catch (err: any) {
                        // If job not found (404) or unauthorized (401), mark for removal
                        if (err.status === 404 || err.status === 401) {
                            return { _removeId: id };
                        }
                        return null;
                    }
                })
            );

            const fetchedJobs = results
                .filter((res): res is { job: BackgroundJob } => res !== null && !('_removeId' in res))
                .map(res => res.job);

            const idsToRemove = results
                .filter((res): res is { _removeId: string } => res !== null && '_removeId' in res)
                .map(res => res._removeId);

            if (idsToRemove.length > 0) {
                const updatedIds = jobIds.filter(id => !idsToRemove.includes(id));
                saveStoredJobIds(updatedIds);
            }

            setJobs(fetchedJobs);
            
            // Only poll if at least one is NOT finished.
            const hasActiveJobs = fetchedJobs.some(j => j.status === 'pending' || j.status === 'processing');
            
            if (!hasActiveJobs && pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        } catch {
            // Silently fail polling
        }
    }, [isAuthenticated, user?.id, getStoredJobIds]);

    // 3. Start polling
    useEffect(() => {
        if (!initialized || !isAuthenticated || !user?.id) return;

        const jobIds = getStoredJobIds();
        if (jobIds.length > 0) {
            checkJobsStatus();
            pollTimerRef.current = setInterval(checkJobsStatus, POLL_INTERVAL);
        }

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
    }, [initialized, isAuthenticated, user?.id, getStoredJobIds, checkJobsStatus]);

    // 4. Methods for components to use
    const startJob = async (type: string, payload?: Record<string, unknown>) => {
        if (!isAuthenticated) throw new Error('Unauthorized');
        
        setIsLoading(true);
        try {
            const { job } = await apiClient.admin.createJob(type, payload);
            const currentIds = getStoredJobIds();
            const newIds = [...new Set([...currentIds, job.id])];
            saveStoredJobIds(newIds);
            
            setJobs(prev => [...prev.filter(j => j.id !== job.id), job]);
            
            if (!pollTimerRef.current) {
                pollTimerRef.current = setInterval(checkJobsStatus, POLL_INTERVAL);
            }
            
            return job;
        } finally {
            setIsLoading(false);
        }
    };

    const clearJob = (jobId: string) => {
        const currentIds = getStoredJobIds();
        const newIds = currentIds.filter(id => id !== jobId);
        saveStoredJobIds(newIds);
        setJobs(prev => prev.filter(j => j.id !== jobId));
    };

    const clearAll = () => {
        saveStoredJobIds([]);
        setJobs([]);
    };

    return {
        jobs,
        isLoading,
        startJob,
        clearJob,
        clearAll,
        isPolling: !!pollTimerRef.current
    };
}
