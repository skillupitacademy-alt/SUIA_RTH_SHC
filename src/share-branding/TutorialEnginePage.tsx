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
import { TutorialDataProvider, useTutorialData } from './TutorialEngine/components/TutorialDataContext';
import { TutorialViewData } from './tutorialPageData';

function TutorialEngineContent() {
  const brandConfig = useBrand();
  const data = useTutorialData();
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedSections, setCompletedSections] = useState(0);
  const totalSections = data.learnerFlow.totalSections;

  const handleSectionView = (_id: string, viewed: boolean) => {
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
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 font-sans">
      <nav className="fixed left-0 right-0 top-0 z-40 flex h-[80px] w-full max-w-full items-center justify-between gap-3 overflow-x-hidden border-b border-gray-200 bg-white px-4 shadow-sm sm:h-[98px] sm:px-6" aria-label="Tutorial navigation">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open tutorial menu"
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 lg:hidden"
          >
            <Bot className="h-6 w-6" style={{ color: brandConfig.primaryColor }} />
          </button>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white sm:h-12 sm:w-12 sm:text-xl"
            style={{ background: brandConfig.primaryColor }}
          >
            {brandConfig.name.substring(0, 1) || 'A'}
          </div>
          <div className="hidden min-w-0 sm:block">
            <h1 className="break-words text-lg font-bold tracking-tight text-gray-800 sm:text-xl">
              {brandConfig.name}
            </h1>
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] font-medium text-gray-700 sm:text-xs">
              <span>{data.nav.courseLabel}</span>
              <span className="text-gray-600">-</span>
              <span className="font-bold text-gray-900">{data.nav.lessonLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard"
            aria-label="Return to dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 sm:px-4 sm:py-2 sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden xs:block">{data.nav.dashboardCtaLabel}</span>
          </Link>
          <div className="hidden text-right xs:block">
            <p className="text-[10px] font-medium text-gray-700">Welcome,</p>
            <p className="text-sm font-bold text-gray-800">{data.nav.learnerName}</p>
          </div>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white sm:h-10 sm:w-10"
            style={{ background: brandConfig.primaryColor }}
          >
            {data.nav.learnerInitials}
          </div>
        </div>
      </nav>

      <Sidebar
        onAITutorClick={() => setIsAITutorOpen(true)}
        onSectionScroll={(id) => {
          scrollToSection(id);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="min-h-screen w-full max-w-full overflow-x-hidden pt-[80px] transition-all sm:pt-[98px] lg:pl-[280px]">
        <div className="mx-auto w-full max-w-[1200px] min-w-0 space-y-6 p-4 sm:space-y-8 sm:p-6">
          <div id="learner-flow">
            <LearnerFlowDashboard completedCount={completedSections} totalCount={totalSections} />
          </div>

          <CurriculumSection onViewChange={handleSectionView} />

          <FacultySupport />
        </div>
      </main>

      <div className="w-full max-w-full overflow-x-hidden">
        <button
          onClick={() => setIsAITutorOpen(true)}
          aria-label={`Open ${brandConfig.tutorLabel}`}
          className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:opacity-100 sm:bottom-8 sm:right-8 sm:hover:scale-110 active:scale-95"
          style={{ background: brandConfig.primaryColor }}
        >
          <Bot className="h-6 w-6 text-white" />
        </button>

        <AITutorDrawer isOpen={isAITutorOpen} onClose={() => setIsAITutorOpen(false)} />
      </div>

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

export default function TutorialEnginePage({ config, data }: { config: BrandConfig; data: TutorialViewData }) {
  return (
    <BrandProvider brand={config}>
      <TutorialDataProvider value={data}>
        <TutorialEngineContent />
      </TutorialDataProvider>
    </BrandProvider>
  );
}
