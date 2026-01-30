import { FetchClient } from '../core/fetch-client';

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
    subjects?: string[]; 
    topicIds?: string[];
    subtopicIds?: string[];
    difficulty?: string; 
    questionCount?: number 
  }) {
    return this.client.post<{ examId: string; questions: any[] }>('/quiz/start', config);
  }

  async submitAnswer(examId: string, questionId: string, answer: string) {
    return this.client.post<{ isCorrect: boolean }>('/quiz/answer', { examId, questionId, answer });
  }

  async submitExam(examId: string) {
    return this.client.post<{ score: number; reportId: string }>('/quiz/submit', { examId });
  }

  async getResult(examId: string) {
    return this.client.get<any>(`/quiz/result?examId=${examId}`);
  }

  async getQuizState(examId: string) {
    return this.client.get<any>(`/quiz/state?examId=${examId}`);
  }
}
