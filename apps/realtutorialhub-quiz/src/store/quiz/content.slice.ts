import { StateCreator } from 'zustand';
import type { Question } from './types';

export interface ContentSlice {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  resetContent: () => void;
}

export const createContentSlice: StateCreator<ContentSlice> = (set) => ({
  questions: [],
  setQuestions: (questions) => set({ questions }),
  resetContent: () => set({ questions: [] })
});
