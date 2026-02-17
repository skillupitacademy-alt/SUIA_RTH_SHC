import { FetchClient } from '../core/fetch-client';
import {
  Domain,
  DomainHierarchy,
  ExamStartResponse,
  QuestionCounts,
  QuestionOption,
  Subject,
  Subtopic,
  Topic,
} from '../types';

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

export interface ActionPlanItem {
  id: string;
  priority: 'critical' | 'growth' | 'stable';
  label: string;
  recommendation: string;
  skills: string[];
  accuracy: number;
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
      percentile?: number;
      actionPlan?: ActionPlanItem[];
      performance: {
        topic?: Array<{ id: string; name: string; score: number; accuracy: number }>;
        difficulty?: Array<{ id: string; name: string; score: number; accuracy: number }>;
        category?: Array<{ id: string; name: string; score: number; accuracy: number }>;
        mapping_type?: Array<{ id: string; name: string; score: number; accuracy: number }>;
        subtopic?: Array<{ id: string; name: string; score: number; accuracy: number }>;
        skill?: Array<{ id: string; name: string; score: number; accuracy: number }>;
      };
      questions: Array<{
        text: string;
        userAnswer: string | null;
        correctAnswer?: string;
        explanation?: string;
        isCorrect: boolean;
        timeSpent: number;
      }>;
    };

export class QuizClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDomains() {
    return this.client.get<Domain[]>('/domains');
  }

  async getDomainHierarchy(domainId: string) {
    return this.client.get<DomainHierarchy>(`/domains?id=${domainId}`);
  }

  async getSubjects(domainId: string) {
    return this.client.get<Subject[]>(`/subjects?domainId=${domainId}`);
  }

  async getTopics(subjectId: string) {
    return this.client.get<Topic[]>(`/topics?subjectId=${subjectId}`);
  }

  async getSubtopics(topicId: string) {
    return this.client.get<Subtopic[]>(`/subtopics?topicId=${topicId}`);
  }

  async getQuestionCount(filters: {
    domainId: string;
    subjects?: string[];
    topicIds?: string[];
    subtopicIds?: string[];
  }) {
    return this.client.post<QuestionCounts, typeof filters>('/quiz/count', filters);
  }

  async startExam(
    config: {
      domainId?: string;
      blueprintId?: string;
      subjectIds?: string[];
      topicIds?: string[];
      subtopicIds?: string[];
      difficulty?: string;
      questionCount?: number;
    },
    opts: { idempotencyKey: string }
  ) {
    return this.client.post<ExamStartResponse, typeof config>('/quiz/start', config, {
      headers: {
        'Idempotency-Key': opts.idempotencyKey,
      },
    });
  }

  async submitAnswer(examId: string, questionId: string, answer: string, opts?: { idempotencyKey?: string }) {
    return this.client.post<
      {
        success: boolean;
        data: {
          examId: string;
          questionId: string;
          status: 'recorded';
        };
      },
      { examId: string; questionId: string; answer: string }
    >(
      '/quiz/answer',
      { examId, questionId, answer },
      {
        headers: opts?.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined,
      }
    );
  }

  async submitExam(examId: string, opts?: { idempotencyKey?: string }) {
    return this.client.post<{ 
      examId: string; 
      status: 'processing' | 'completed' | 'failed' | 'abandoned'; 
    }>('/quiz/submit', { examId }, {
        headers: opts?.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined
    });
  }

  async getResult(examId: string) {
    return this.client.get<QuizResultResponse>(`/quiz/result?examId=${examId}`);
  }

  async getQuizState(examId: string) {
    return this.client.get<QuizState>(`/quiz/state?examId=${examId}`);
  }
}
