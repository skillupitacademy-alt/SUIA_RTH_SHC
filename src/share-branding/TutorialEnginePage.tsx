'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, ChevronLeft } from 'lucide-react';
import { BrandConfig } from './brandConfig';
import { BrandProvider, useBrand } from './PostLandingPage/app/context/BrandContext';
import { Sidebar } from './TutorialEngine/components/Sidebar';
import { AITutorDrawer } from './TutorialEngine/components/AITutorDrawer';
import { LearnerFlowDashboard } from './TutorialEngine/components/LearnerFlowDashboard';
import { CurriculumSection } from './TutorialEngine/components/CurriculumSection';
import { FacultySupport } from './TutorialEngine/components/FacultySupport';

function TutorialEngineContent() {
  const brandConfig = useBrand(); // dynamically loaded
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [completedSections, setCompletedSections] = useState(0);
  const totalSections = 6;

  const handleSectionView = (id: string, viewed: boolean) => {
    if (viewed) {
      setCompletedSections((prev) => Math.min(prev + 1, totalSections));
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[98px] z-30 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl"
            style={{ background: brandConfig.primaryColor }}
          >
            {brandConfig.name.substring(0, 1) || 'A'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              {brandConfig.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
              <span>Full-Stack Development</span>
              <span className="text-gray-400">→</span>
              <span>React Fundamentals</span>
              <span className="text-gray-400">→</span>
              <span style={{ color: brandConfig.primaryColor }} className="font-bold">
                Component Architecture
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="text-right">
            <p className="text-xs text-gray-600 font-medium">Welcome back,</p>
            <p className="font-bold text-gray-800">Alex Johnson</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
            style={{ background: brandConfig.primaryColor }}
          >
            AJ
          </div>
        </div>
      </nav>

      <Sidebar 
        onAITutorClick={() => setIsAITutorOpen(true)} 
        onSectionScroll={scrollToSection}
      />

      {/* Main Content Pillar (60/40 Split applies conceptually across components) */}
      <main className="ml-[260px] pt-[98px] min-h-screen transition-all">
        <div className="max-w-[1200px] mx-auto p-8 space-y-8">
          <div id="learner-flow">
            <LearnerFlowDashboard 
              completedCount={completedSections} 
              totalCount={totalSections}
            />
          </div>

          <CurriculumSection 
            onViewChange={handleSectionView}
          />

          <FacultySupport />
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAITutorOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 z-30 opacity-90 hover:opacity-100"
        style={{ background: brandConfig.primaryColor }}
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* Slide-out Drawer */}
      <AITutorDrawer 
        isOpen={isAITutorOpen} 
        onClose={() => setIsAITutorOpen(false)}
      />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgb(241 245 249); }
        ::-webkit-scrollbar-thumb { background: rgb(203 213 225); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgb(148 163 184); }
      `}</style>
    </div>
  );
}

export default function TutorialEnginePage({ config }: { config: BrandConfig }) {
  // Binds the heavily modular component tree natively to our Brand Provider hook scope
  return (
    <BrandProvider brand={config}>
      <TutorialEngineContent />
    </BrandProvider>
  );
}
