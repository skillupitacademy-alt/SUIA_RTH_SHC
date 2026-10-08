import { DomainHierarchy, QuestionCounts } from '@quiz/api-client';

export interface BffQuizHierarchyResponse {
    domains: DomainHierarchy[];
}

export interface BffExamConfigResponse {
    questionCount: QuestionCounts;
    minQuestions: number;
    maxQuestions: number;
    availableBlueprints: Array<{ id: string; name: string }>;
}

export async function getBffQuizHierarchy(): Promise<BffQuizHierarchyResponse> {
    const res = await fetch('/api/bff/quiz-hierarchy', {
        credentials: 'include', // 🔥 Include cookies for auth
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`BFF quiz hierarchy failed: ${res.status} ${body}`);
    }
    return res.json() as Promise<BffQuizHierarchyResponse>;
}

export async function getBffExamConfig(filters: {
    domainId: string;
    subjectIds?: string[];
    topicIds?: string[];
    subtopicIds?: string[];
}): Promise<BffExamConfigResponse> {
    const params = new URLSearchParams({ domainId: filters.domainId });

    if (filters.subjectIds?.length) params.set('subjectIds', filters.subjectIds.join(','));
    if (filters.topicIds?.length) params.set('topicIds', filters.topicIds.join(','));
    if (filters.subtopicIds?.length) params.set('subtopicIds', filters.subtopicIds.join(','));

    const res = await fetch(`/api/bff/exam-config?${params.toString()}`, {
        credentials: 'include', // 🔥 Include cookies for auth
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`BFF exam config failed: ${res.status} ${body}`);
    }
    return res.json() as Promise<BffExamConfigResponse>;
}
