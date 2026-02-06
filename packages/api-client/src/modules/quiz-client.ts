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

  async getSubjects(domainId: string) {
    return this.client.get<any[]>(`/subjects?domainId=${domainId}`);
  }

  async getTopics(subjectId: string) {
    return this.client.get<any[]>(`/topics?subjectId=${subjectId}`);
  }

  async getSubtopics(topicId: string) {
    // Note: Assuming there is a public subtopics endpoint or it's handled via topics
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
      remainingSeconds: number | null;
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
    // Backend returns sanitized ACK only (no correctness)
    return this.client.post<{ 
      success: boolean; 
      data: { 
        examId: string; 
        questionId: string; 
        status: string 
      } 
    }>('/quiz/answer', { examId, questionId, answer });
  }

  async submitExam(examId: string) {
    // Backend returns status transition info
    return this.client.post<{ 
      examId: string; 
      status: 'processing' | 'completed' | 'failed' | 'abandoned'; 
    }>('/quiz/submit', { examId });
  }

  async getResult(examId: string) {
    return this.client.get<any>(`/quiz/result?examId=${examId}`);
  }

  async getQuizState(examId: string) {
    return this.client.get<any>(`/quiz/state?examId=${examId}`);
  }
}
