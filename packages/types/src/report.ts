export interface ReportJSON {
  meta: {
    userId: string;
    examId: string;
    generatedAt: string;
    depth: 1 | 2 | 3;
    totalQuestions: number;
    candidateName: string;
  };

  hierarchy: DomainNode;

  datasets: {
    topics: Record<string, TopicDataset>;
    subjects: Record<string, SubjectDataset>;
    domain: DomainDataset;
  };

  appendix: {
    questionBank: QuestionItem[];
  };
}

export interface DomainNode {
  id: string;
  name: string;
  subjects: SubjectNode[];
}

export interface SubjectNode {
  id: string;
  name: string;
  topics: TopicNode[];
}

export interface TopicNode {
  id: string;
  name: string;
  subtopicCount: number;
}

export interface TopicDataset {
  topicId: string;
  name: string;
  accuracy: number;
  attempted: number;
  correct: number;
  incorrect: number;
  avgTime: number;

  subtopics: {
    id: string;
    name: string;
    accuracy: number;
    attempted: number;
  }[];

  timeSeries: {
    date: string;
    score: number;
  }[];

  difficultySplit: {
    easy: number;
    medium: number;
    hard: number;
  };

  heatmap: {
    subtopic: string;
    difficulty: string;
    accuracy: number;
    attempts: number;
  }[];

  ai: {
    status: "READY" | "BORDERLINE" | "NOT_READY" | "DATA_INSUFFICIENT";
    actions: string[];
    weakest_subtopic?: string;
    weakest_skill?: string;
  };

  skills: {
    name: string;
    accuracy: number;
    attempts: number;
  }[];

  lineage: {
    domain: string;
    subject: string;
    topic: string;
  };
}

export interface SubjectDataset {
  subjectId: string;
  name: string;
  topicAccuracies: {
    topicId: string;
    topicName: string;
    accuracy: number;
  }[];

  strengths: string[];
  weaknesses: string[];
}

export interface DomainDataset {
  domainId: string;
  name: string;
  subjectAccuracies: {
    subjectId: string;
    subjectName: string;
    accuracy: number;
  }[];

  overallAccuracy: number;
}

export interface QuestionItem {
  id: string;
  text: string;
  userAnswer: string | null;
  correctAnswer: string | null;
  explanation: string | null;
  isCorrect: boolean;
  timeSpent: number;
  difficulty: string;
}
