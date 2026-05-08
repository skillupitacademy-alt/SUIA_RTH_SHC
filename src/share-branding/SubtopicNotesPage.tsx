// Rebuild trigger: Centralized navigation and footer stability
import React, { useState } from 'react';
import { Bot, CheckCircle2, ChevronRight, Send, Star, TrendingUp } from 'lucide-react';
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
import { VisualExplanationContent } from './TutorialEngine/components/notes/VisualExplanationContent';
import { PracticeTestContent } from './TutorialEngine/components/notes/PracticeTestContent';
import { AssignmentContent } from './TutorialEngine/components/notes/AssignmentContent';
import { ProjectContent } from './TutorialEngine/components/notes/ProjectContent';
import { QuizContent } from './TutorialEngine/components/notes/QuizContent';
import { TabFooter } from './TutorialEngine/components/notes/TabFooter';

import { SubtopicViewPage } from './SubtopicViewPage';

export interface SubtopicNotesPageProps {
  notesData: SubtopicNotesViewData;
  overviewData: any; // SubtopicViewData type
  subtopicId?: string;
}

export function SubtopicNotesPage({ notesData, overviewData, subtopicId = 'component-architecture' }: SubtopicNotesPageProps) {
  const brand = useBrand();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Add shared quiz state
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
        // Reset question index when switching to quiz tab
        if (tab === 'quiz') {
          setCurrentQuestionIndex(0);
        }
      }
    }
  }, []);

  const orderedTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Full Notes' },
    { id: 'layman', label: 'Layman Explanation' },
    { id: 'real-life', label: 'Real Life Examples' },
    { id: 'technical-deep-dive', label: 'Technical Deep Dive' },
    { id: 'code-example', label: 'Code Example' },
    { id: 'visual-explanation', label: 'Visual Explanation' },
    { id: 'practice-test', label: 'Practice Test' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'project', label: 'Projects' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'ai-tutor', label: brand.tutorLabel }
  ];

  const handleTabChange = (id: string) => {
    const url = new URL(window.location.href);
    if (id === 'overview') {
      // Remove tab parameter for overview
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', id);
    }
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
        .subtopic-code-wrap, .subtopic-code-wrap * { overflow-wrap: anywhere; word-break: break-word; }
      `}} />

      {/* Top Navigation Bar */}
      <SubtopicTopBar
        data={notesData.nav}
        isLeftOpen={isSidebarOpen}
        isRightOpen={isRightSidebarOpen}
        onToggleLeft={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleRight={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      />

      <div className="relative flex min-w-0 flex-1 overflow-hidden">
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
          data={notesData.leftSidebar}
          isOpen={isSidebarOpen}
          activeId={activeTab}
          onSelect={handleTabChange}
        />

        {/* Main Scrollable Content */}
        <main 
          id="main-content-area"
          className="min-w-0 flex-1 overflow-y-auto hide-scrollbar bg-white"
          tabIndex={0}
          onClick={() => {
            if (isSidebarOpen) setIsSidebarOpen(false);
            if (isRightSidebarOpen) setIsRightSidebarOpen(false);
          }}
        >
          <div className="mx-auto flex min-h-full w-full min-w-0 flex-col px-4 py-6 transition-all duration-500 sm:px-6 sm:py-8 lg:px-10 xl:px-12">
            <div className="min-w-0 flex-1">
                {/* Centralized Breadcrumbs */}
                <nav aria-label="Breadcrumbs" className="mb-8 flex min-w-0 flex-wrap items-center gap-2 text-[13px] font-bold text-slate-500">
                  <a href="#" className="hover:text-slate-900 transition-colors">Home</a>
                  <ChevronRight size={14} className="text-slate-400" />
                  <a href="#" className="hover:text-slate-900 transition-colors">JavaScript</a>
                  <ChevronRight size={14} className="text-slate-400" />
                  <a href={`/start-learning/subtopic/${subtopicId}`} className="hover:text-slate-900 transition-colors">{notesData.mainContent.title}</a>
                  <ChevronRight size={14} className="text-slate-400" />
                  <span className="break-words text-slate-950 cursor-default" style={{ color: brand.primaryColorDark }}>
                    {orderedTabs.find(t => t.id === activeTab)?.label || 'Overview'}
                  </span>
                </nav>

                {activeTab === 'overview' && (
                  <SubtopicViewPage data={overviewData} hideTopBar={true} hideSidebars={true} subtopicId={subtopicId} />
                )}
                {activeTab === 'notes' && (
                  <>
                    <h1 className="sr-only">Full Notes - {notesData.mainContent.title}</h1>
                    <NotesMainContent data={notesData.mainContent} isStandalone={false} />
                  </>
                )}
                {activeTab === 'layman' && (
                  <>
                    <h1 className="sr-only">Layman Explanation - {notesData.mainContent.title}</h1>
                    <LaymanExplanationContent data={notesData.mainContent.laymanExplanation} />
                  </>
                )}
                {activeTab === 'real-life' && (
                  <>
                    <h1 className="sr-only">Real Life Examples - {notesData.mainContent.title}</h1>
                    <RealLifeExamplesContent data={notesData.mainContent.realLifeExamples} />
                  </>
                )}
                {activeTab === 'technical-deep-dive' && (
                  <>
                    <h1 className="sr-only">Technical Deep Dive - {notesData.mainContent.title}</h1>
                    <TechnicalDeepDiveContent data={notesData.mainContent.technicalDeepDive} />
                  </>
                )}
                {activeTab === 'code-example' && notesData.mainContent.codeExample && (
                  <>
                    <h1 className="sr-only">Code Example - {notesData.mainContent.title}</h1>
                    <CodeExampleContent data={notesData.mainContent.codeExample} />
                  </>
                )}
                {activeTab === 'visual-explanation' && notesData.mainContent.visualExplanation && (
                  <>
                    <h1 className="sr-only">Visual Explanation - {notesData.mainContent.title}</h1>
                    <VisualExplanationContent data={notesData.mainContent.visualExplanation} />
                  </>
                )}
                {activeTab === 'practice-test' && notesData.mainContent.practiceTest && (
                  <>
                    <h1 className="sr-only">Practice Test - {notesData.mainContent.title}</h1>
                    <PracticeTestContent data={notesData.mainContent.practiceTest} />
                  </>
                )}
                {activeTab === 'assignments' && notesData.mainContent.assignment && (
                  <>
                    <h1 className="sr-only">Assignments - {notesData.mainContent.title}</h1>
                    <AssignmentContent data={notesData.mainContent.assignment} />
                  </>
                )}
                {activeTab === 'project' && notesData.mainContent.project && (
                  <>
                    <h1 className="sr-only">Projects - {notesData.mainContent.title}</h1>
                    <ProjectContent data={notesData.mainContent.project} />
                  </>
                )}
                {activeTab === 'quiz' && notesData.mainContent.quiz && (
                  <>
                    <h1 className="sr-only">Quiz - {notesData.mainContent.title}</h1>
                    <QuizContent 
                      data={notesData.mainContent.quiz} 
                      currentQuestionIndex={currentQuestionIndex}
                      onQuestionChange={setCurrentQuestionIndex}
                    />
                  </>
                )}
                {activeTab === 'ai-tutor' && (
                  <section className="min-w-0 space-y-6 rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-8">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: brand.primaryColor }}>
                        <Bot size={24} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{notesData.rightSidebar.aiTutor.title}</h1>
                        <p className="break-words text-sm font-medium text-slate-800">Component Architecture support thread</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {notesData.rightSidebar.aiTutor.messages.map((message, index) => (
                        <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-full rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed text-slate-950 shadow-sm sm:max-w-[80%]" style={{ backgroundColor: message.sender === 'user' ? `${brand.primaryColor}15` : '#f8fafc' }}>
                            <p className="break-words">{message.text}</p>
                            <p className="mt-2 text-[10px] font-bold text-slate-600">{message.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        aria-label={`Ask ${brand.tutorLabel}`}
                        placeholder={notesData.rightSidebar.aiTutor.inputPlaceholder}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm font-medium text-slate-950 placeholder:text-slate-700 focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': brand.primaryColor } as React.CSSProperties}
                      />
                      <button className="absolute right-3 top-2.5 rounded-xl p-1.5 text-white" style={{ backgroundColor: brand.primaryColor }} aria-label="Send message">
                        <Send size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </section>
                )}
                {activeTab === 'progress' && (
                  <section className="min-w-0 space-y-6 rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-8">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: brand.primaryColor }}>
                        <TrendingUp size={24} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Progress Tracker</h1>
                        <p className="break-words text-sm font-medium text-slate-800">{notesData.leftSidebar.progress.message}</p>
                      </div>
                    </div>
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Course</p>
                        <p className="mt-2 break-words text-lg font-bold text-slate-950">{notesData.rightSidebar.courseProgress.courseName}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Completion</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">{notesData.rightSidebar.courseProgress.label}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">XP</p>
                        <p className="mt-2 flex items-center gap-2 text-lg font-bold text-emerald-800"><Star size={18} aria-hidden="true" /> +{notesData.rightSidebar.xpStats.earned} XP</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {notesData.leftSidebar.items.filter(item => item.id !== 'overview').slice(0, 8).map((item) => (
                        <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                          <CheckCircle2 size={18} className={item.status === 'completed' ? 'text-emerald-800' : 'text-slate-400'} aria-hidden="true" />
                          <span className="min-w-0 break-words text-sm font-bold text-slate-900">{item.label}</span>
                          <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
            </div>

            {/* Standardized Navigation Footer - Centralized for Stability */}
            <div className="mt-12 min-w-0 pt-8">
                <TabFooter 
                    prevLabel={prevTab?.label}
                    nextLabel={nextTab?.label}
                    onPrev={prevTab ? () => handleTabChange(prevTab.id) : undefined}
                    onNext={nextTab ? () => handleTabChange(nextTab.id) : undefined}
                />
            </div>
          </div>
        </main>

        {/* Right Sidebar - Stats & Tutor */}
        <NotesRightSidebar
          data={notesData.rightSidebar}
          isOpen={isRightSidebarOpen}
          activeTab={activeTab}
          quizData={notesData.mainContent.quiz}
          currentQuestionIndex={currentQuestionIndex}
          onQuestionChange={setCurrentQuestionIndex}
        />
      </div>
    </div>
  );
}
