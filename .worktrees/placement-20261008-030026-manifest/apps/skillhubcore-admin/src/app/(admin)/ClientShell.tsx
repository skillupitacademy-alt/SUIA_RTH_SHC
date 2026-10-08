"use client";

import { apiClient } from '@quiz/api-client';
import React, { type ReactNode } from 'react';
import { ShellContext } from './ShellContext';
import { useClientShell } from './components/useClientShell';
import { LeftSidebar } from './components/LeftSidebar';
import { Header } from './components/Header';
import { RightSidebar } from './components/RightSidebar';

apiClient.client.setPortalIdentity('admin');

export default function ClientShell({ children }: { children: ReactNode }) {
  const {
    isLeftSidebarOpen,
    setIsLeftSidebarOpen,
    isRightSidebarOpen,
    setIsRightSidebarOpen,
    headerTitle,
    setHeaderTitle,
    headerSubtitle,
    setHeaderSubtitle,
    isLoggingOut,
    pathname,
    handleLogout
  } = useClientShell();

  const [rightSidebarContent, setRightSidebarContent] = React.useState<React.ReactNode>(null);
  const [rightSidebarWidth, setRightSidebarWidth] = React.useState<string>('360px');

  return (
    <ShellContext.Provider value={{
      isRightSidebarOpen,
      toggleRightSidebar: () => setIsRightSidebarOpen(!isRightSidebarOpen),
      setIsRightSidebarOpen,
      headerTitle,
      setHeaderTitle,
      headerSubtitle,
      setHeaderSubtitle,
      rightSidebarContent,
      setRightSidebarContent,
      rightSidebarWidth,
      setRightSidebarWidth
    }}>
      <div className="flex h-screen bg-[#f4f7fa] font-sans text-slate-800 overflow-hidden relative w-full">
        {/* Skip to Content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] bg-pink-600 text-white px-4 py-2 rounded-lg font-bold shadow-xl"
        >
          Skip to Content
        </a>

        {/* Left Sidebar */}
        <LeftSidebar
          isLeftSidebarOpen={isLeftSidebarOpen}
          setIsLeftSidebarOpen={setIsLeftSidebarOpen}
          pathname={pathname}
        />

        {/* Main Content Layout */}
        <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
          {/* Header */}
          <Header
            isLeftSidebarOpen={isLeftSidebarOpen}
            setIsLeftSidebarOpen={setIsLeftSidebarOpen}
            isRightSidebarOpen={isRightSidebarOpen}
            setIsRightSidebarOpen={setIsRightSidebarOpen}
            headerTitle={headerTitle}
            headerSubtitle={headerSubtitle}
            pathname={pathname}
            rightSidebarContent={rightSidebarContent}
            isLoggingOut={isLoggingOut}
            handleLogout={handleLogout}
          />

          {/* Page Content Container */}
          <main id="main-content" className="flex-1 overflow-y-auto bg-[#f4f7fa] custom-scrollbar focus:outline-none" tabIndex={-1}>
            <div className="max-w-[1600px] mx-auto p-6 md:p-8">
              {children}
            </div>
          </main>
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          isRightSidebarOpen={isRightSidebarOpen}
          setIsRightSidebarOpen={setIsRightSidebarOpen}
          rightSidebarContent={rightSidebarContent}
          rightSidebarWidth={rightSidebarWidth}
        />

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.3);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.5);
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </ShellContext.Provider>
  );
}
