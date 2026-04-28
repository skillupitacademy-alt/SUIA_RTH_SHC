'use client';

import React, { createContext, useContext } from 'react';
import { TutorialViewData } from '../../tutorialPageData';

const TutorialDataContext = createContext<TutorialViewData | null>(null);

export function TutorialDataProvider({
  value,
  children,
}: {
  value: TutorialViewData;
  children: React.ReactNode;
}) {
  return <TutorialDataContext.Provider value={value}>{children}</TutorialDataContext.Provider>;
}

export function useTutorialData() {
  const context = useContext(TutorialDataContext);
  if (!context) {
    throw new Error('useTutorialData must be used within TutorialDataProvider');
  }
  return context;
}
