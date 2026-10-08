"use client";

import { createContext } from 'react';

export const ShellContext = createContext({
  isRightSidebarOpen: false,
  toggleRightSidebar: () => { },
  setIsRightSidebarOpen: (_open: boolean) => { }, // eslint-disable-line @typescript-eslint/no-unused-vars
  headerTitle: '',
  setHeaderTitle: (_title: string) => { }, // eslint-disable-line @typescript-eslint/no-unused-vars
  headerSubtitle: '',
  setHeaderSubtitle: (_subtitle: string) => { }, // eslint-disable-line @typescript-eslint/no-unused-vars
  rightSidebarContent: null as React.ReactNode,
  setRightSidebarContent: (_content: React.ReactNode) => { }, // eslint-disable-line @typescript-eslint/no-unused-vars
  rightSidebarWidth: '360px',
  setRightSidebarWidth: (_width: string) => { } // eslint-disable-line @typescript-eslint/no-unused-vars
});
