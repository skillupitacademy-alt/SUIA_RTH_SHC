export interface QuizSectionPattern {
  title: string;
  description: string;
  totalQuestions: number;
  duration: string;
  xp: number;
  questions: Array<{
    id: string;
    questionNumber: number;
    type: string;
    points: number;
    question: string;
    code?: string;
    options: Array<{
      id: string;
      text: string;
    }>;
    correctAnswer: string;
    explanation: string;
  }>;
}
