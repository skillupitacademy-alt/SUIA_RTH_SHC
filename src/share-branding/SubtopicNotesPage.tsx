// Rebuild trigger: Centralized navigation and footer stability
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
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
import { TabFooter } from './TutorialEngine/components/notes/TabFooter';

export interface SubtopicNotesPageProps {
  data: SubtopicNotesViewData;
}

export function SubtopicNotesPage({ data }: SubtopicNotesPageProps) {
  const brand = useBrand();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveTab(tab);
    }
  }, []);

  const orderedTabs = [
    { id: 'notes', label: 'Full Notes' },
    { id: 'layman', label: 'Layman Explanation' },
    { id: 'real-life', label: 'Real Life Examples' },
    { id: 'technical-deep-dive', label: 'Technical Deep Dive' },
    { id: 'code-example', label: 'Code Example' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'project', label: 'Projects' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'ai-tutor', label: 'AI Tutor' }
  ];

  const handleTabChange = (id: string) => {
    if (id === 'overview') {
      window.location.href = '/start-learning/subtopic';
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    window.history.pushState({}, '', url);
    setActiveTab(id);
    setIsSidebarOpen(false);
    
    // Scroll to top on tab change
    const scrollContainer = document.getElementById('main-content-area');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentTabIndex = orderedTabs.findIndex(t => t.id === activeTab);
  const nextTab = orderedTabs[currentTabIndex + 1];
  const prevTab = orderedTabs[currentTabIndex - 1];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Dynamic Branding Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-primary-dynamic { background-color: ${brand.primaryColor}; }
        .text-primary-dynamic { color: ${brand.primaryColor}; }
        .text-primary-dark { color: ${brand.primaryColorDark}; }
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
          onSelect={handleTabChange}
        />

        {/* Main Scrollable Content */}
        <main 
          id="main-content-area"
          className="flex-1 overflow-y-auto hide-scrollbar bg-white" 
          tabIndex={0}
          onClick={() => {
            if (isSidebarOpen) setIsSidebarOpen(false);
            if (isRightSidebarOpen) setIsRightSidebarOpen(false);
          }}
        >
          <div className="mx-auto flex min-h-full w-full flex-col px-8 py-10 lg:px-12 xl:px-16 transition-all duration-500">
            <div className="flex-1">
                {/* Centralized Breadcrumbs */}
                <nav aria-label="Breadcrumbs" className="mb-8 flex flex-wrap items-center gap-2 text-[13px] font-bold text-slate-500">
                  <a href="#" className="hover:text-slate-900 transition-colors">Home</a>
                  <ChevronRight size={14} className="text-slate-400" />
                  <a href="#" className="hover:text-slate-900 transition-colors">JavaScript</a>
                  <ChevronRight size={14} className="text-slate-400" />
                  <a href="/start-learning/subtopic" className="hover:text-slate-900 transition-colors">Component Architecture</a>
                  <ChevronRight size={14} className="text-slate-400" />
                  <span className="text-slate-950 cursor-default" style={{ color: brand.primaryColorDark }}>
                    {orderedTabs.find(t => t.id === activeTab)?.label || 'Notes'}
                  </span>
                </nav>

                {activeTab === 'notes' && (
                  <NotesMainContent data={data.mainContent} isStandalone={false} />
                )}
                {activeTab === 'layman' && (
                  <LaymanExplanationContent data={data.mainContent.laymanExplanation} />
                )}
                {activeTab === 'real-life' && (
                  <RealLifeExamplesContent data={data.mainContent.realLifeExamples} />
                )}
                {activeTab === 'technical-deep-dive' && (
                  <TechnicalDeepDiveContent data={data.mainContent.technicalDeepDive} />
                )}
                {activeTab === 'code-example' && (
                  <CodeExampleContent />
                )}
                {activeTab === 'assignments' && (
                  <AssignmentContent />
                )}
                {activeTab === 'project' && (
                  <ProjectContent />
                )}
                {activeTab === 'quiz' && (
                  <QuizContent />
                )}
            </div>

            {/* Standardized Navigation Footer - Centralized for Stability */}
            <div className="mt-12 pt-8">
                <TabFooter 
                    prevLabel={prevTab?.label}
                    nextLabel={nextTab?.label}
                    onPrev={prevTab ? () => handleTabChange(prevTab.id) : undefined}
                    onNext={nextTab ? () => handleTabChange(nextTab.id) : undefined}
                />
            </div>
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
