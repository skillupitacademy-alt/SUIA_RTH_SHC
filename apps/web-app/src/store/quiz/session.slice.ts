import { StateCreator } from 'zustand';
import type { QuizConfig } from './types';

export interface SessionSlice {
  isActive: boolean;
  isSubmitted: boolean;
  examId: string | null;
  config: QuizConfig | null;

  startQuizSession: (config: QuizConfig, examId: string) => void;
  setExamId: (id: string) => void;
  finishQuiz: () => void;
  resetSession: () => void;
}

export const createSessionSlice: StateCreator<SessionSlice> = (set) => ({
  isActive: false,
  isSubmitted: false,
  examId: null,
  config: null,

  startQuizSession: (config, examId) => set({
    isActive: true,
    isSubmitted: false,
    config,
    examId
  }),

  setExamId: (id) => set({ examId: id }),

  finishQuiz: () => set({
    isActive: false,
    isSubmitted: true
  }),

  resetSession: () => set({
    isActive: false,
    isSubmitted: false,
    examId: null,
    config: null
  })
});
