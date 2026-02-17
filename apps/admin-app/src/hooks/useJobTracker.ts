"use client";

import type { BackgroundJob } from '@quiz/api-client';
import { apiClient } from '@quiz/api-client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { useJobStore } from '@/store/job-store';
import { safeGet, safeSet } from '@/utils/safeLocalStorage';

const POLL_INTERVAL = 5000; // 5 seconds
const LOCAL_STORAGE_KEY = 'admin-active-jobs';

export function useJobTracker() {
    const { user, isAuthenticated, initialized } = useAuthStore();
    const { jobs, setJobs, updateJob, removeJob, setPolling, isPolling } = useJobStore();
    const [isLoading, setIsLoading] = useState(false);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Load active job IDs from localStorage for the current user
    const getStoredJobIds = useCallback((): string[] => {
        if (user?.id === undefined || user.id === null || user.id === '') return [];
        const stored = safeGet<string[]>(`${LOCAL_STORAGE_KEY}-${user.id}`);
        if (stored === null || stored === undefined) return [];
        return stored;
    }, [user?.id]);

    const saveStoredJobIds = useCallback((ids: string[]) => {
        if (user?.id === undefined || user.id === null || user.id === '') return;
        safeSet(`${LOCAL_STORAGE_KEY}-${user.id}`, ids);
    }, [user?.id]);

    // 2. Poll status for all tracked jobs
    const checkJobsStatus = useCallback(async () => {
        if (isAuthenticated === false || user?.id === undefined || user.id === null || user.id === '') return;

        const jobIds = getStoredJobIds();
        if (jobIds.length === 0) {
            setJobs([]);
            return;
        }

        try {
            type JobResult = { job: BackgroundJob } | { _removeId: string } | null;
            const results: JobResult[] = await Promise.all(
                jobIds.map(async (id) => {
                    try {
                        return await apiClient.admin.getJobById(id);
                    } catch (err: unknown) {
                        if (err !== null && typeof err === 'object' && 'status' in err && (err.status === 404 || err.status === 401)) {
                            return { _removeId: id };
                        }
                        return null;
                    }
                })
            );

            const fetchedJobs: BackgroundJob[] = results
                .filter((res): res is { job: BackgroundJob } => res !== null && !('_removeId' in res))
                .map(res => res.job);

            const idsToRemove: string[] = results
                .filter((res): res is { _removeId: string } => res !== null && '_removeId' in res)
                .map(res => res._removeId);

            if (idsToRemove.length > 0) {
                const updatedIds = jobIds.filter(id => !idsToRemove.includes(id));
                saveStoredJobIds(updatedIds);
            }

            setJobs(fetchedJobs);
            
            const hasActiveJobs = fetchedJobs.some(j => j.status === 'pending' || j.status === 'processing');
            
            if (!hasActiveJobs && pollTimerRef.current !== null) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
                setPolling(false);
            }
        } catch {
            // Silently fail polling
        }
    }, [isAuthenticated, user?.id, getStoredJobIds, saveStoredJobIds, setJobs, setPolling]);

    // 3. Start polling
    useEffect(() => {
        if (initialized === false || isAuthenticated === false || user?.id === undefined || user.id === null || user.id === '') return;

        const jobIds = getStoredJobIds();
        if (jobIds.length > 0) {
            void checkJobsStatus();
            setPolling(true);
            if (pollTimerRef.current === null) {
                pollTimerRef.current = setInterval(() => { void checkJobsStatus(); }, POLL_INTERVAL);
            }
        }

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
                setPolling(false);
            }
        };
    }, [initialized, isAuthenticated, user?.id, getStoredJobIds, checkJobsStatus, setPolling]);

    // 4. Methods for components to use
    const startJob = async (type: string, payload?: Record<string, unknown>) => {
        if (!isAuthenticated) throw new Error('Unauthorized');
        
        setIsLoading(true);
        try {
            const { job } = await apiClient.admin.createJob(type, payload);
            const currentIds = getStoredJobIds();
            const newIds = [...new Set([...currentIds, job.id])];
            saveStoredJobIds(newIds);
            
            updateJob(job);
            
            if (pollTimerRef.current === null) {
                setPolling(true);
                pollTimerRef.current = setInterval(() => { void checkJobsStatus(); }, POLL_INTERVAL);
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
        removeJob(jobId);
    };

    const clearAll = () => {
        saveStoredJobIds([]);
        setJobs([]);
        setPolling(false);
    };

    return {
        jobs,
        isLoading,
        startJob,
        clearJob,
        clearAll,
        isPolling
    };
}
