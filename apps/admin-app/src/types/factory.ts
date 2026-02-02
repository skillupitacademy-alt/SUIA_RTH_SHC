export type Difficulty = 'simple' | 'intermediate' | 'expert';
export type MappingType = 'conceptual' | 'technical' | 'practical';

export interface GeneratedQuestion {
    id?: string; // Local temporary ID for UI tracking
    questionText: string;
    codeSnippet?: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: Difficulty;
    depthLevel: number; // 1-10
    mappingType: MappingType;
    skillNames: string[];
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    questions: GeneratedQuestion[];
}

export interface FactoryBlueprint {
    domainId: string;
    subjectId: string;
    topicId: string;
    subtopicId?: string;
    counts: {
        simple: number;
        intermediate: number;
        expert: number;
    };
}
