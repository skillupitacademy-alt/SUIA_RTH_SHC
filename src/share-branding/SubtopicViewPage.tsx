'use client';

import React, { useState } from 'react';
import { useBrand } from './PostLandingPage/app/context/BrandContext';
import { SubtopicViewData } from './subtopicPageData';
import { SubtopicHeader } from './TutorialEngine/components/subtopic/SubtopicHeader';
import { SubtopicContentGrid } from './TutorialEngine/components/subtopic/SubtopicContentGrid';
import { SubtopicSidebar } from './TutorialEngine/components/subtopic/SubtopicSidebar';
import { SubtopicTopBar } from './TutorialEngine/components/subtopic/SubtopicTopBar';
import { SubtopicRightPanel } from './TutorialEngine/components/subtopic/SubtopicRightPanel';
import { TabFooter } from './TutorialEngine/components/notes/TabFooter';
import { ChevronRight } from 'lucide-react';

interface SubtopicViewPageProps {
  data: SubtopicViewData;
  hideTopBar?: boolean;
  hideSidebars?: boolean;
  subtopicId?: string;
}

export function SubtopicViewPage({ data, hideTopBar = false, hideSidebars = false, subtopicId = 'component-architecture' }: SubtopicViewPageProps) {
  const brand = useBrand();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  return (
    <div className={hideTopBar ? "w-full" : "flex h-screen w-full flex-col overflow-hidden bg-[#F8FAFC]"}>
      {/* Dynamic Branding Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-primary-dynamic { background-color: ${brand.primaryColor}; }
        .text-primary-dynamic { color: ${brand.primaryColor}; }
        .text-primary-dark { color: ${brand.primaryColorDark}; }
        .border-primary-dynamic { border-color: ${brand.primaryColor}; }
        .hover-text-primary:hover { color: ${brand.primaryColor}; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}} />

      {/* Top Navigation Bar */}
      {!hideTopBar && (
        <SubtopicTopBar
          data={data.nav}
          isLeftOpen={isSidebarOpen}
          isRightOpen={isRightSidebarOpen}
          onToggleLeft={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleRight={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        />
      )}

      <div className={hideTopBar ? "w-full" : "relative flex min-w-0 flex-1 overflow-hidden"}>
        {/* Left Sidebar - Curriculum & Progress */}
        {!hideSidebars && (
          <SubtopicSidebar
            data={data.subtopic.sidebar}
            progress={{
              percentage: data.subtopic.overallProgress?.percentage || 0,
              checklist: data.subtopic.overallProgress?.checklist || []
            }}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}

        {/* Main Scrollable Content */}
        {hideTopBar ? (
          <div 
            tabIndex={0} 
            className="w-full"
          >
            <div className="w-full space-y-8">
              {/* Main Content Body */}
              <div className="min-w-0 flex-1 space-y-8 lg:space-y-10">
                  {/* Header Section */}
                  <SubtopicHeader data={{
                    title: data.subtopic.title,
                    description: data.subtopic.description,
                    iconLabel: data.subtopic.iconLabel,
                    progress: data.subtopic.progress,
                    progressLabel: data.subtopic.progressLabel,
                    metadata: data.subtopic.metadata,
                    checklist: data.subtopic.overallProgress?.checklist
                  }} />

                  {/* Content Grid Area */}
                  <div className="min-h-[400px] min-w-0">
                    <SubtopicContentGrid
                      content={data.subtopic.content}
                      tasks={data.subtopic.tasks}
                      subtopicId={subtopicId}
                    />
                  </div>
              </div>
            </div>
          </div>
        ) : (
          <main 
            tabIndex={0} 
            className="min-w-0 flex-1 overflow-y-auto hide-scrollbar bg-slate-50/30 focus:outline-none"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                if (isSidebarOpen) setIsSidebarOpen(false);
                if (isRightSidebarOpen) setIsRightSidebarOpen(false);
              }
            }}
          >
            <div className="flex min-h-full w-full min-w-0 flex-col px-4 py-6 transition-all duration-500 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
              {/* Main Content Body */}
              <div className="min-w-0 flex-1 space-y-8 lg:space-y-10">
                  {/* Breadcrumbs */}
                  <nav aria-label="Breadcrumbs" className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
                    <span className="hover:text-slate-900 cursor-pointer transition-colors">Home</span>
                    <ChevronRight size={16} className="text-slate-400" />
                    <span className="hover:text-slate-900 cursor-pointer transition-colors">{data.nav.courseLabel}</span>
                    <ChevronRight size={16} className="text-slate-400" />
                    <span className="break-words font-black text-primary-dark">{data.subtopic.title}</span>
                  </nav>

                  {/* Header Section */}
                  <SubtopicHeader data={{
                    title: data.subtopic.title,
                    description: data.subtopic.description,
                    iconLabel: data.subtopic.iconLabel,
                    progress: data.subtopic.progress,
                    progressLabel: data.subtopic.progressLabel,
                    metadata: data.subtopic.metadata,
                    checklist: data.subtopic.overallProgress?.checklist
                  }} />

                  {/* Content Grid Area */}
                  <div className="min-h-[400px] min-w-0">
                    <SubtopicContentGrid
                      content={data.subtopic.content}
                      tasks={data.subtopic.tasks}
                      subtopicId={subtopicId}
                    />
                  </div>
              </div>

              {/* Standardized Navigation Footer */}
              <div className="mt-12 pt-8">
                  <TabFooter 
                      prevLabel={data.subtopic.navigation.prev.title}
                      nextLabel={data.subtopic.navigation.next.title}
                      onPrev={() => console.log('Prev Topic')}
                      onNext={() => console.log('Next Topic')}
                  />
              </div>
            </div>
          </main>
        )}

        {/* Right Sidebar - Stats & Tutor */}
        {!hideSidebars && (
          <SubtopicRightPanel
            data={data.rightSidebar}
            isOpen={isRightSidebarOpen}
          />
        )}
      </div>
    </div>
  );
}
