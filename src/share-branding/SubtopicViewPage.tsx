'use client';

import React, { useState } from 'react';
import { useBrand } from './PostLandingPage/app/context/BrandContext';
import { SubtopicViewData } from './subtopicPageData';
import { SubtopicTopBar } from './TutorialEngine/components/subtopic/SubtopicTopBar';
import { SubtopicSidebar } from './TutorialEngine/components/subtopic/SubtopicSidebar';
import { SubtopicHeader } from './TutorialEngine/components/subtopic/SubtopicHeader';
import { SubtopicTabs } from './TutorialEngine/components/subtopic/SubtopicTabs';
import { SubtopicContentGrid } from './TutorialEngine/components/subtopic/SubtopicContentGrid';
import { SubtopicRightPanel } from './TutorialEngine/components/subtopic/SubtopicRightPanel';

interface SubtopicViewPageProps {
  data: SubtopicViewData;
}

export function SubtopicViewPage({ data }: SubtopicViewPageProps) {
  const brand = useBrand();
  const [activeTab, setActiveTab] = useState(data.subtopic.tabs[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Top Navigation */}
      <SubtopicTopBar data={data.nav} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Subtopics List */}
        <SubtopicSidebar 
          data={data.subtopic.sidebar} 
          progress={data.subtopic.overallProgress}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="mx-auto max-w-6xl p-6 lg:p-8">
            {/* Header with Title & Detailed Progress */}
            <SubtopicHeader data={data.subtopic} />

            {/* Tab Navigation */}
            <div className="mt-8">
              <SubtopicTabs 
                tabs={data.subtopic.tabs} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
              />
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'learn' && (
                <SubtopicContentGrid content={data.subtopic.content} tasks={data.subtopic.tasks} />
              )}
              {/* Other tabs would be implemented here */}
              {activeTab !== 'learn' && (
                <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                  <p className="text-gray-500">Content for {activeTab} is coming soon.</p>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-8 pb-12">
              <button className="flex flex-col items-start gap-1 group">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Previous</span>
                <span className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">
                  {data.subtopic.navigation.prev.title}
                </span>
              </button>
              <button className="flex flex-col items-end gap-1 group">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Next Topic</span>
                <span className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">
                  {data.subtopic.navigation.next.title}
                </span>
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Stats & AI Tutor */}
        <SubtopicRightPanel data={data.rightSidebar} />
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
