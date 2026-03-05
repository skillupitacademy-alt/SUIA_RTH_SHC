import { StateCreator } from 'zustand';

export interface InteractionSlice {
  answers: Record<string, number>;
  markedForReview: string[];
  currentQuestionIndex: number;

  setAnswer: (questionId: string, optionIndex: number) => void;
  toggleReview: (questionId: string) => void;
  setCurrentIndex: (index: number) => void;
  resetInteraction: () => void;
}

export const createInteractionSlice: StateCreator<InteractionSlice> = (set) => ({
  answers: {},
  markedForReview: [],
  currentQuestionIndex: 0,

  setAnswer: (questionId, optionIndex) => set((state) => ({
    answers: { ...state.answers, [questionId]: optionIndex }
  })),

  toggleReview: (questionId) => set((state) => ({
    markedForReview: state.markedForReview.includes(questionId)
      ? state.markedForReview.filter(id => id !== questionId)
      : [...state.markedForReview, questionId]
  })),

  setCurrentIndex: (index) => set({ currentQuestionIndex: index }),

  resetInteraction: () => set({
    answers: {},
    markedForReview: [],
    currentQuestionIndex: 0
  })
});
