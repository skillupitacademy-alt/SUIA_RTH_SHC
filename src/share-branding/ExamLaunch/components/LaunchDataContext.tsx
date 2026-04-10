'use client';

import React, { createContext, useContext } from 'react';
import { LaunchViewData } from '../../launchExamPageData';

const LaunchDataContext = createContext<LaunchViewData | null>(null);

export function LaunchDataProvider({
  value,
  children,
}: {
  value: LaunchViewData;
  children: React.ReactNode;
}) {
  return <LaunchDataContext.Provider value={value}>{children}</LaunchDataContext.Provider>;
}

export function useLaunchData() {
  const context = useContext(LaunchDataContext);
  if (!context) {
    throw new Error('useLaunchData must be used within LaunchDataProvider');
  }
  return context;
}
