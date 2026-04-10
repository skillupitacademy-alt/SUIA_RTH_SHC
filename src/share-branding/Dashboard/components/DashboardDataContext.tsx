'use client';

import React, { createContext, useContext } from 'react';
import { DashboardViewData } from '../../dashboardPageData';

const DashboardDataContext = createContext<DashboardViewData | null>(null);

export function DashboardDataProvider({
  value,
  children,
}: {
  value: DashboardViewData;
  children: React.ReactNode;
}) {
  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  return context;
}
