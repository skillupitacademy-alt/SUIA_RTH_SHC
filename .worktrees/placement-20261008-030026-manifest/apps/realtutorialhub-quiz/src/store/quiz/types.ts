export interface Question {
  id: string;
  type: 'MCQ' | 'CODE_MCQ';
  text: string;
  code?: string;
  options: string[];
  difficulty: string;
}

export interface QuizConfig {
  domain: string;
  subjects: string[];
  difficulty: string;
}
