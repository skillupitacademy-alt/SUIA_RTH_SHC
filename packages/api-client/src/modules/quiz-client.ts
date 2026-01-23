import { FetchClient } from '../core/fetch-client';

export class QuizClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDomains() {
    return this.client.get<any[]>('/domains');
  }

  async startExam(config: { domainId: string; subjectId?: string; difficulty?: string }) {
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
}
