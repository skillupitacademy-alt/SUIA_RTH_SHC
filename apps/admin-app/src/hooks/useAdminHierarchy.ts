'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@quiz/api-client';

export function useAdminHierarchy() {
    const [domains, setDomains] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [topics, setTopics] = useState<any[]>([]);
    const [subtopics, setSubtopics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDomains = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getDomains(1, 100);
            setDomains(response.data);
        } catch (error) {
            console.error('Failed to fetch domains for hierarchy:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubjects = async (domainId?: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getSubjects(1, 200, domainId);
            setSubjects(response.data);
        } catch (error) {
            console.error('Failed to fetch subjects for hierarchy:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTopics = async (subjectId?: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getTopics(1, 500, subjectId);
            setTopics(response.data);
        } catch (error) {
            console.error('Failed to fetch topics for hierarchy:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubtopics = async (topicId?: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getSubtopics(1, 1000, topicId);
            setSubtopics(response.data);
        } catch (error) {
            console.error('Failed to fetch subtopics for hierarchy:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, []);

    return {
        domains,
        subjects,
        topics,
        subtopics,
        isLoading,
        fetchDomains,
        fetchSubjects,
        fetchTopics,
        fetchSubtopics
    };
}
