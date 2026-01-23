import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Question {
  id: number;
  type: 'MCQ' | 'CODE_MCQ';
  text: string;
  code?: string;
  options: string[];
  difficulty: 'Simple' | 'Intermediate' | 'Expert';
}

interface QuizState {
  isActive: boolean;
  questions: Question[];
  answers: Record<number, number>;
  markedForReview: number[];
  timeLeft: number;
  currentQuestionIndex: number;
  config: {
    domain: string;
    subjects: string[];
    difficulty: string;
  } | null;
  examId: string | null;
  isSubmitted: boolean;

  // Actions
  startQuiz: (questions: Question[], config: any, duration: number) => void;
  setExamId: (id: string) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (questionId: number, optionIndex: number) => void;
  toggleReview: (questionId: number) => void;
  updateTimer: () => void;
  updateTimeLeft: () => void; // Alias for updateTimer
  setTimeRemaining: (time: number) => void;
  setCurrentIndex: (index: number) => void;
  finishQuiz: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      isActive: false,
      questions: [],
      answers: {},
      markedForReview: [],
      timeLeft: 0,
      currentQuestionIndex: 0,
      config: null,
      examId: null,
      isSubmitted: false,

      startQuiz: (questions, config, duration) => set({
        isActive: true,
        questions,
        config,
        timeLeft: duration,
        answers: {},
        markedForReview: [],
        currentQuestionIndex: 0,
        isSubmitted: false, // Reset submission state
      }),

      setExamId: (id) => set({ examId: id }),
      
      setQuestions: (questions) => set({ questions }),

      setAnswer: (questionId, optionIndex) => set((state) => ({
        answers: { ...state.answers, [questionId]: optionIndex }
      })),

      toggleReview: (questionId) => set((state) => ({
        markedForReview: state.markedForReview.includes(questionId)
          ? state.markedForReview.filter(id => id !== questionId)
          : [...state.markedForReview, questionId]
      })),

      updateTimer: () => set((state) => ({
        timeLeft: state.timeLeft > 0 ? state.timeLeft - 1 : 0
      })),
      
      updateTimeLeft: () => get().updateTimer(),

      setTimeRemaining: (time) => set({ timeLeft: time }),

      setCurrentIndex: (index) => set({ currentQuestionIndex: index }),

      finishQuiz: () => set({
        isActive: false,
        isSubmitted: true,
        // We keep questions/answers for results page viewing, but clear session status
      }),
    }),
    {
      name: 'active-quiz-session',
    }
  )
);
