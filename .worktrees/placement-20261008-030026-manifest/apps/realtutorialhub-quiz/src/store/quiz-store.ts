import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createContentSlice, type ContentSlice } from './quiz/content.slice';
import { createInteractionSlice, type InteractionSlice } from './quiz/interaction.slice';
import { createSessionSlice, type SessionSlice } from './quiz/session.slice';
import { createTimerSlice, type TimerSlice } from './quiz/timer.slice';
import type { Question, QuizConfig } from './quiz/types';

export type { Question, QuizConfig };

type QuizStore = SessionSlice & ContentSlice & InteractionSlice & TimerSlice & {
  // Legacy compatibility / Aggregated actions
  startQuiz: (questions: Question[], config: QuizConfig, duration: number) => void;
};

// ⚠️ ALWAYS use selectors: useStore(s => s.field), never useStore()
export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get, store) => ({
      ...createSessionSlice(set, get, store),
      ...createContentSlice(set, get, store),
      ...createInteractionSlice(set, get, store),
      ...createTimerSlice(set, get, store),

      // Unified helper for backward compatibility
      startQuiz: (questions, config, duration) => {
        const { startQuizSession, setQuestions, setTimeRemaining, resetInteraction } = get();
        resetInteraction();
        startQuizSession(config, ''); // examId will be set later by ExamEngine or caller
        setQuestions(questions);
        setTimeRemaining(duration);
      },
    }),
    {
      name: 'active-quiz-session',
    }
  )
);
