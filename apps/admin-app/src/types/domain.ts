export interface Domain {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Subject {
    id: string;
    name: string;
    domainId: string;
    slug: string;
    description?: string;
    icon?: string;
    orderIndex?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Topic {
    id: string;
    name: string;
    subjectId: string;
    slug: string;
    description?: string;
    orderIndex?: number;
    complexity?: 'beginner' | 'intermediate' | 'advanced';
    createdAt?: string;
    updatedAt?: string;
}

export interface Subtopic {
    id: string;
    name: string;
    topicId: string;
    slug: string;
    description?: string;
    orderIndex?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Skill {
    id: string;
    name: string;
    description?: string;
    category?: string;
    createdAt?: string;
    updatedAt?: string;
}
