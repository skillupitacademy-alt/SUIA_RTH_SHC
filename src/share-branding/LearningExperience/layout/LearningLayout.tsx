'use client';

import React from 'react';
import { Sidebar } from '../navigation/Sidebar';
import { TableOfContents } from '../navigation/TableOfContents';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface LearningLayoutProps {
  children: React.ReactNode;
  tocItems: TocItem[];
}

export function LearningLayout({ children, tocItems }: LearningLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex">
        {/* Left Sidebar — Course Nav */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 min-w-0 py-10 px-6 lg:px-10">
          {children}
        </main>

        {/* Right Sidebar — Table of Contents */}
        <div className="xl:block hidden">
          <TableOfContents items={tocItems} />
        </div>
      </div>
    </div>
  );
}
