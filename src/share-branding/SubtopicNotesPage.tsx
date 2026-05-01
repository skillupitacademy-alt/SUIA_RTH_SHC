import React, { useState } from 'react';
import { useBrand } from './PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from './subtopicNotesData';
import { SubtopicTopBar } from './TutorialEngine/components/subtopic/SubtopicTopBar';
import { NotesLeftSidebar } from './TutorialEngine/components/notes/NotesLeftSidebar';
import { NotesMainContent } from './TutorialEngine/components/notes/NotesMainContent';
import { NotesRightSidebar } from './TutorialEngine/components/notes/NotesRightSidebar';
import { LaymanExplanationContent } from './TutorialEngine/components/notes/LaymanExplanationContent';
import { RealLifeExamplesContent } from './TutorialEngine/components/notes/RealLifeExamplesContent';
import { TechnicalDeepDiveContent } from './TutorialEngine/components/notes/TechnicalDeepDiveContent';
import { CodeExampleContent } from './TutorialEngine/components/notes/CodeExampleContent';
import { AssignmentContent } from './TutorialEngine/components/notes/AssignmentContent';
import { ProjectContent } from './TutorialEngine/components/notes/ProjectContent';
import { QuizContent } from './TutorialEngine/components/notes/QuizContent';

export interface SubtopicNotesPageProps {
  data: SubtopicNotesViewData;
}

export function SubtopicNotesPage({ data }: SubtopicNotesPageProps) {
  const brand = useBrand();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Dynamic Branding Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-primary-dynamic { background-color: ${brand.primaryColor}; }
        .text-primary-dynamic { color: ${brand.primaryColor}; }
        .text-primary-dark { color: ${brand.primaryColor}; filter: brightness(0.85); }
        .border-primary-dynamic { border-color: ${brand.primaryColor}; }
        .ring-primary-dynamic { --tw-ring-color: ${brand.primaryColor}; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
        {/* Mobile Overlay */}
        {(isSidebarOpen || isRightSidebarOpen) && (
          <div 
            className="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsRightSidebarOpen(false);
            }}
          />
        )}
        {/* Left Sidebar - Learning Path */}
        <NotesLeftSidebar
          data={data.leftSidebar}
          isOpen={isSidebarOpen}
          activeId={activeTab}
          onSelect={(id) => {
            setActiveTab(id);
            setIsSidebarOpen(false);
          }}
        />

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto hide-scrollbar bg-white" tabIndex={0}>
          <div className="mx-auto w-full px-8 py-10 lg:px-12 xl:px-16">
            {activeTab === 'notes' && <NotesMainContent data={data.mainContent} isStandalone={false} />}
            {activeTab === 'layman' && <LaymanExplanationContent data={data.mainContent.laymanExplanation} />}
            {activeTab === 'real-life' && <RealLifeExamplesContent data={data.mainContent.realLifeExamples} />}
            {activeTab === 'technical-deep-dive' && <TechnicalDeepDiveContent data={data.mainContent.technicalDeepDive} onNext={() => setActiveTab('code-example')} />}
            {activeTab === 'code-example' && <CodeExampleContent onNext={() => setActiveTab('assignments')} />}
            {activeTab === 'assignments' && <AssignmentContent onNext={() => setActiveTab('project')} />}
            {activeTab === 'project' && <ProjectContent onNext={() => setActiveTab('quiz')} />}
            {activeTab === 'quiz' && <QuizContent onNext={() => setActiveTab('ai-tutor')} />}
          </div>
        </main>

        {/* Right Sidebar - Stats & AI Tutor */}
        <NotesRightSidebar
          data={data.rightSidebar}
          isOpen={isRightSidebarOpen}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}
