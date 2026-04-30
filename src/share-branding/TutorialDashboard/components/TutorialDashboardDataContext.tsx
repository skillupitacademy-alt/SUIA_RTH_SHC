import React from 'react';
import { TutorialDashboardViewData } from '../../tutorialDashboardData';

const TutorialDashboardDataContext = React.createContext<TutorialDashboardViewData | null>(null);

export function TutorialDashboardDataProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: TutorialDashboardViewData;
}) {
  return <TutorialDashboardDataContext.Provider value={value}>{children}</TutorialDashboardDataContext.Provider>;
}

export function useTutorialDashboardData() {
  const context = React.useContext(TutorialDashboardDataContext);
  if (!context) {
    throw new Error('useTutorialDashboardData must be used within a TutorialDashboardDataProvider');
  }
  return context;
}
