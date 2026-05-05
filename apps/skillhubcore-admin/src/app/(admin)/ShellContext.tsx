"use client";

import { createContext } from 'react';

export const ShellContext = createContext({
  isRightSidebarOpen: false,
  toggleRightSidebar: () => { },
  headerTitle: '',
  setHeaderTitle: (title: string) => { },
  headerSubtitle: '',
  setHeaderSubtitle: (subtitle: string) => { }
});
