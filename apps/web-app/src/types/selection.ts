export interface SelectionState {
  domainId: string;
  subjectIds: string[];
  topicIds: string[];
  subtopicIds: string[];
  difficulty: 'simple' | 'mixed' | 'expert';
  questionCount: number;
  isArmed: boolean;
  step: number;
}

export interface SelectionMetadata {
  domains: any[];
  subjects: any[];
  topics: any[];
  subtopics: any[];
}
