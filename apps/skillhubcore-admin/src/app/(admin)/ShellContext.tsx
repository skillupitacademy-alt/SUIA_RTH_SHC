"use client";

import { createContext } from 'react';

export const ShellContext = createContext({
  isRightSidebarOpen: false,
  toggleRightSidebar: () => { },
  headerTitle: '',
  setHeaderTitle: (_title: string) => { }, // eslint-disable-line @typescript-eslint/no-unused-vars
  headerSubtitle: '',
  setHeaderSubtitle: (_subtitle: string) => { } // eslint-disable-line @typescript-eslint/no-unused-vars
});
