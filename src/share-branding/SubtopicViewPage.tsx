'use client';

import React, { useState } from 'react';
import { useBrand } from './PostLandingPage/app/context/BrandContext';
import { SubtopicViewData } from './subtopicPageData';
import { SubtopicHeader } from './TutorialEngine/components/subtopic/SubtopicHeader';
import { SubtopicTabs } from './TutorialEngine/components/subtopic/SubtopicTabs';
import { SubtopicContentGrid } from './TutorialEngine/components/subtopic/SubtopicContentGrid';
import { SubtopicSidebar } from './TutorialEngine/components/subtopic/SubtopicSidebar';
import { SubtopicTopBar } from './TutorialEngine/components/subtopic/SubtopicTopBar';
import { SubtopicRightPanel } from './TutorialEngine/components/subtopic/SubtopicRightPanel';
import { ChevronRight } from 'lucide-react';

interface SubtopicViewPageProps {
  data: SubtopicViewData;
}

export function SubtopicViewPage({ data }: SubtopicViewPageProps) {
  const brand = useBrand();
  const [activeTab, setActiveTab] = useState(data.subtopic.tabs[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Dynamic Branding Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-primary-dynamic { background-color: ${brand.primaryColor}; }
        .text-primary-dynamic { color: ${brand.primaryColor}; }
        .text-primary-dark { color: ${brand.primaryColor}; filter: brightness(0.85); }
        .border-primary-dynamic { border-color: ${brand.primaryColor}; }
        .hover-text-primary:hover { color: ${brand.primaryColor}; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}} />

      {/* Top Navigation Bar */}
      <SubtopicTopBar
        data={data.nav}
        isLeftOpen={isSidebarOpen}
        isRightOpen={isRightSidebarOpen}
        onToggleLeft={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleRight={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Sidebar - Curriculum & Progress */}
        <SubtopicSidebar
          data={data.subtopic.sidebar}
          progress={{
            percentage: data.subtopic.overallProgress?.percentage || 0,
            checklist: data.subtopic.overallProgress?.checklist || []
          }}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Scrollable Content */}
        <main 
          tabIndex={0} 
          className="flex-1 overflow-y-auto hide-scrollbar bg-slate-50/30 focus:outline-none"
          onClick={() => {
            if (isSidebarOpen) setIsSidebarOpen(false);
            if (isRightSidebarOpen) setIsRightSidebarOpen(false);
          }}
        >
          <div className="mx-auto w-full max-w-[1600px] px-8 py-10 space-y-10 transition-all duration-500">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <span className="hover:text-slate-900 cursor-pointer transition-colors">Home</span>
              <ChevronRight size={16} className="text-slate-400" />
              <span className="hover:text-slate-900 cursor-pointer transition-colors">JavaScript</span>
              <ChevronRight size={16} className="text-slate-400" />
              <span className="text-primary-dark font-black">Component Architecture</span>
            </nav>

            {/* Header Section */}
            <SubtopicHeader data={{
              title: data.subtopic.title,
              description: data.subtopic.description,
              progress: data.subtopic.progress,
              progressLabel: data.subtopic.progressLabel,
              metadata: data.subtopic.metadata
            }} />

            {/* Mastery Learning Path Heading */}
            <div className="flex flex-col gap-2 py-2">
              <h2 className="text-3xl font-black tracking-tighter text-slate-950 uppercase">
                Mastery Learning Roadmap
              </h2>
              <p className="text-sm font-bold text-slate-600">
                Complete all 10 modules to master this topic and earn up to 500 XP.
              </p>
            </div>

            {/* Content Grid Area */}
            <div className="min-h-[400px]">
              <SubtopicContentGrid
                content={data.subtopic.content}
                tasks={data.subtopic.tasks}
              />
            </div>

            {/* Bottom Navigation */}
            <nav aria-label="Topic navigation" className="mt-12 flex items-center justify-between pt-8 pb-12">
              <button className="flex flex-col items-start gap-1 group" aria-label={`Previous topic: ${data.subtopic.navigation.prev.title}`}>
                <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wider">Previous</span>
                <span className="text-[13px] font-black text-slate-800 hover-text-primary transition-colors">
                  {data.subtopic.navigation.prev.title}
                </span>
              </button>
              <button className="flex flex-col items-end gap-1 group" aria-label={`Next topic: ${data.subtopic.navigation.next.title}`}>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Next Topic</span>
                <span className="text-sm font-black text-slate-800 hover-text-primary transition-colors">
                  {data.subtopic.navigation.next.title}
                </span>
              </button>
            </nav>
          </div>
        </main>

        {/* Right Sidebar - Stats & AI Tutor */}
        <SubtopicRightPanel
          data={data.rightSidebar}
          isOpen={isRightSidebarOpen}
        />
      </div>
    </div>
  );
}
