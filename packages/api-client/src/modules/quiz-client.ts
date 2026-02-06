import { FetchClient } from '../core/fetch-client';

export interface QuizState {
  id: string;
  examId: string;
  status: 'started' | 'processing' | 'completed' | 'failed' | 'abandoned';
  remainingTimeSeconds: number;
  startedAt: string;
  progress: {
    totalQuestions: number;
    answeredCount: number;
  };
  questions: Array<{
    questionId: string;
    text: string;
    options: string[];
    codeSnippet?: string | null;
    type: string;
    difficulty: string;
    userAnswer: string | null;
    order: number;
  }>;
}

export type QuizResultResponse = 
  | { status: 'processing'; message: string }
  | { 
      id: string;
      status: 'completed' | 'failed' | 'abandoned';
      score: number;
      total: number;
      percentage: number;
      statusLabel: 'passed' | 'failed';
      timeTaken?: string;
      performance: {
        topic?: Array<{ id: string; name: string; score: number; accuracy: number }>;
        difficulty?: Array<{ id: string; name: string; score: number; accuracy: number }>;
      };
      questions: Array<{
        text: string;
        userAnswer: string | null;
        correctAnswer?: string;
        explanation?: string;
        isCorrect: boolean;
      }>;
    };

export class QuizClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDomains() {
    return this.client.get<any[]>('/domains');
  }

  async getDomainHierarchy(domainId: string) {
    return this.client.get<any>(`/domains?id=${domainId}`);
  }

  async getSubjects(domainId: string) {
    return this.client.get<any[]>(`/subjects?domainId=${domainId}`);
  }

  async getTopics(subjectId: string) {
    return this.client.get<any[]>(`/topics?subjectId=${subjectId}`);
  }

  async getSubtopics(topicId: string) {
    return this.client.get<any[]>(`/subtopics?topicId=${topicId}`);
  }

  async getQuestionCount(filters: {
    domainId: string;
    subjects?: string[];
    topicIds?: string[];
    subtopicIds?: string[];
  }) {
    return this.client.post<any>('/quiz/count', filters);
  }

  async startExam(config: { 
    domainId?: string; 
    blueprintId?: string; 
    subjectIds?: string[]; 
    topicIds?: string[];
    subtopicIds?: string[];
    difficulty?: string; 
    questionCount?: number 
  }, opts: { idempotencyKey: string }) {
    return this.client.post<{ 
      examId: string; 
      status: string;
      totalQuestions: number;
      durationSeconds: number | null;
      remainingSeconds: number | null; // Keep remainingSeconds as per backend startExam
      firstQuestion: {
        id: string;
        questionText: string;
        options: any[];
        codeSnippet: string | null;
        type: string;
        order: number;
      } | null;
    }>('/quiz/start', config, {
        headers: {
            'Idempotency-Key': opts.idempotencyKey
        }
    });
  }

  async submitAnswer(examId: string, questionId: string, answer: string) {
    return this.client.post<{ 
      success: boolean; 
      data: { 
        examId: string; 
        questionId: string; 
        status: 'recorded' 
      } 
    }>('/quiz/answer', { examId, questionId, answer });
  }

  async submitExam(examId: string) {
    return this.client.post<{ 
      examId: string; 
      status: 'processing' | 'completed' | 'failed' | 'abandoned'; 
    }>('/quiz/submit', { examId });
  }

  async getResult(examId: string) {
    return this.client.get<QuizResultResponse>(`/quiz/result?examId=${examId}`);
  }

  async getQuizState(examId: string) {
    return this.client.get<QuizState>(`/quiz/state?examId=${examId}`);
  }
}
