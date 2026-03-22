'use client';

import { create } from 'zustand';

export type TutorialFactorySelection = {
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert';
};

type TutorialFactoryStore = {
  selection: TutorialFactorySelection;
  setSelection: (next: Partial<TutorialFactorySelection>) => void;
  resetSelection: () => void;
};

const INITIAL_SELECTION: TutorialFactorySelection = {
  domainId: '',
  subjectId: '',
  topicId: '',
  subtopicId: '',
  difficulty: 'mixed',
};

export const useTutorialFactoryStore = create<TutorialFactoryStore>((set) => ({
  selection: INITIAL_SELECTION,
  setSelection: (next) =>
    set((state) => ({
      selection: {
        ...state.selection,
        ...next,
      },
    })),
  resetSelection: () => set({ selection: INITIAL_SELECTION }),
}));

