export type Status = 'draft' | 'active' | 'archived' | 'deleted';
export type Difficulty = 'simple' | 'intermediate' | 'expert';
export type SkillCategory = 'technical' | 'soft' | 'analytical' | 'creative' | 'managerial' | 'communication';
export type MappingType = 'conceptual' | 'technical' | 'practical';

export interface Domain {
    id: string;
    name: string;
    slug?: string;
    externalId?: string;
    description?: string | null;
    category?: string | null;
    status: Status;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface Subject {
    id: string;
    name: string;
    slug?: string;
    externalId?: string;
    domainId: string;
    description?: string | null;
    order?: number;
    orderIndex?: number; // alias used in UI
    status: Status;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface Topic {
    id: string;
    name: string;
    slug?: string;
    externalId?: string;
    subjectId: string;
    description?: string | null;
    complexityLevel: number;
    weight: number;
    learningUrl?: string | null;
    detailedNotesPath?: string | null;
    status: Status;
    // optional derived fields for UI convenience
    complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    orderIndex?: number;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface Subtopic {
    id: string;
    name: string;
    slug?: string;
    externalId?: string;
    topicId: string;
    description?: string | null;
    depthLevel?: number;
    orderIndex?: number;
    status?: Status; // UI may supply, though DB does not store
    difficultyLevels?: string[];
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface Skill {
    id: string;
    name: string;
    description?: string | null;
    category?: SkillCategory;
    mappingType?: MappingType;
    weight?: number;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}
