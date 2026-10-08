import { Domain, Subject, Topic, Subtopic } from '@quiz/api-client';

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
  domains: Domain[];
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
}
