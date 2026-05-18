'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Sparkles, RefreshCw, X, AlertTriangle, HelpCircle } from 'lucide-react';
import { ComponentCreator } from './ComponentCreator';
import { EditComponentModal } from './EditComponentModal';
import { SubtopicNotesPage } from '@/share-branding/SubtopicNotesPage';
import { SubtopicNotesViewData } from '@/share-branding/subtopicNotesData';

interface InteractiveVisualEditorProps {
  jsonInput: string;
  selectedSection: string;
  selectedSectionLabel: string;
  subtopicId: string;
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  isInlineSaving: boolean;
  newComponentType: string;
  setNewComponentType: (type: string) => void;
  handleAddComponent: () => void;
  handleStartEdit: (key: string, value: any) => void;
  handleDeleteComponent: (key: string) => void;
  editingFieldKey: string | null;
  editingFieldData: any;
  setEditingFieldData: React.Dispatch<React.SetStateAction<any>>;
  handleSaveEdit: () => void;
  setEditingFieldKey: (key: string | null) => void;
}

export function InteractiveVisualEditor({
  jsonInput,
  selectedSection,
  selectedSectionLabel,
  subtopicId,
  isRightSidebarOpen,
  toggleRightSidebar,
  isInlineSaving,
  newComponentType,
  setNewComponentType,
  handleAddComponent,
  handleStartEdit,
  handleDeleteComponent,
  editingFieldKey,
  editingFieldData,
  setEditingFieldData,
  handleSaveEdit,
  setEditingFieldKey,
}: InteractiveVisualEditorProps) {
  let parsedContent: any = null;
  let parseError: string | null = null;
  try {
    if (jsonInput.trim()) {
      const parsed = JSON.parse(jsonInput);
      const rootKeys = Object.keys(parsed);
      if (rootKeys.length === 1 && rootKeys[0] === selectedSection) {
        parsedContent = parsed[selectedSection];
      } else {
        parsedContent = parsed;
      }
    }
  } catch (e: any) {
    parseError = e.message || 'JSON Syntax Error';
  }

  if (!isRightSidebarOpen) return null;

  // Construct mock overviewData to ensure the Overview tab is fully compliant
  const mockOverviewData = {
    nav: {
      courseLabel: 'Course',
      lessonLabel: 'Lesson',
      dashboardCtaLabel: 'Dashboard',
      streak: 7,
      xpPoints: 2450,
      learnerInitials: 'JD'
    },
    subtopic: {
      title: subtopicId ? subtopicId.toUpperCase() : 'What is JavaScript?',
      description: 'Master the fundamental concepts of ' + (subtopicId || 'this topic') + '.',
      iconLabel: 'JS',
      progress: 0,
      progressLabel: '0/5 Tasks Completed',
      metadata: [
        { label: 'Level', value: 'Beginner' },
        { label: 'XP Reward', value: '100 XP' }
      ],
      sidebar: {
        title: 'Curriculum',
        items: []
      },
      content: {
        heading: 'Getting Started',
        description: 'Explore the core concepts step-by-step.',
        infographic: {
          title: 'Architecture Overview',
          image: null,
          steps: []
        }
      },
      tasks: [],
      overallProgress: {
        percentage: 0,
        checklist: []
      },
      navigation: {
        prev: { title: 'Previous Topic' },
        next: { title: 'Next Topic' }
      }
    },
    rightSidebar: {
      learnerCard: {
        initials: 'JD',
        name: 'John Doe',
        streak: 7,
        streakLabel: '7 Day Streak!',
        xp: 2450,
        xpLabel: '2450 XP Earned'
      },
      aiTutor: {
        title: 'AI Study Assistant',
        messages: [],
        inputPlaceholder: 'Ask me anything...'
      },
      relatedContent: []
    }
  };

  // Map selectedSection to mockNotesData.mainContent fields
  const sectionParsedContent: any = {};
  if (parsedContent && !parseError) {
    if (selectedSection === 'notes') {
      Object.assign(sectionParsedContent, parsedContent);
    } else if (selectedSection === 'layman') {
      sectionParsedContent.laymanExplanation = parsedContent;
    } else if (selectedSection === 'real-life') {
      sectionParsedContent.realLifeExamples = parsedContent;
    } else if (selectedSection === 'technical-deep-dive') {
      sectionParsedContent.technicalDeepDive = parsedContent;
    } else if (selectedSection === 'code-example') {
      sectionParsedContent.codeExample = parsedContent;
    } else if (selectedSection === 'visual-explanation') {
      sectionParsedContent.visualExplanation = parsedContent;
    } else if (selectedSection === 'practice-test') {
      sectionParsedContent.practiceTest = parsedContent;
    } else if (selectedSection === 'assignments') {
      sectionParsedContent.assignment = parsedContent;
    } else if (selectedSection === 'project') {
      sectionParsedContent.project = parsedContent;
    } else if (selectedSection === 'quiz') {
      sectionParsedContent.quiz = parsedContent;
    } else if (selectedSection === 'summary') {
      sectionParsedContent.summary = parsedContent;
    } else if (selectedSection === 'interview') {
      sectionParsedContent.interview = parsedContent;
    }
  }

  // Construct mockNotesData compliant with SubtopicNotesViewData interface
  const mockNotesData: SubtopicNotesViewData = {
    nav: {
      courseLabel: 'Course',
      lessonLabel: 'Lesson',
      dashboardCtaLabel: 'Dashboard',
      streak: 7,
      xpPoints: 2450,
      learnerInitials: 'JD'
    },
    leftSidebar: {
      title: 'Learning Path',
      items: [
        { id: 'overview', label: 'Overview', status: 'completed', icon: 'LayoutDashboard' },
        { id: 'notes', label: 'Full Notes', status: 'active', icon: 'FileText' },
        { id: 'layman', label: 'Layman Explanation', status: 'pending', icon: 'Lightbulb' },
        { id: 'real-life', label: 'Real Life Examples', status: 'pending', icon: 'Globe' },
        { id: 'technical-deep-dive', label: 'Technical Deep Dive', status: 'pending', icon: 'Palette' },
        { id: 'code-example', label: 'Code Example', status: 'pending', icon: 'Monitor' },
        { id: 'visual-explanation', label: 'Visual Explanation', status: 'pending', icon: 'Eye' },
        { id: 'practice-test', label: 'Practice Test', status: 'pending', icon: 'Pencil' },
        { id: 'assignments', label: 'Assignments', status: 'pending', icon: 'ClipboardList' },
        { id: 'project', label: 'Projects', status: 'pending', icon: 'Rocket' },
        { id: 'quiz', label: 'Quiz', status: 'pending', icon: 'HelpCircle' },
        { id: 'summary', label: 'Summary', status: 'pending', icon: 'FileCheck' },
        { id: 'interview', label: 'Interview Prep', status: 'pending', icon: 'MessagesSquare' },
        { id: 'ai-tutor', label: 'AI Tutor', status: 'pending', icon: 'Bot' },
        { id: 'progress', label: 'Progress', status: 'pending', icon: 'TrendingUp' }
      ],
      progress: {
        percentage: 65,
        message: '65% Complete'
      }
    },
    mainContent: {
      breadcrumbs: ['Home', 'JavaScript', 'Introduction', subtopicId ? subtopicId.toUpperCase() : 'WHAT IS JAVASCRIPT'],
      title: subtopicId ? subtopicId.toUpperCase() : 'What is JavaScript?',
      meta: {
        readTime: '10 min read',
        level: 'Intermediate',
        xp: 50
      },
      ...sectionParsedContent
    },
    rightSidebar: {
      aiTutor: {
        title: 'Tutor (Ask Anything)',
        messages: [
          { text: 'Ask me anything about this subtopic!', time: '2:30 PM', sender: 'bot' }
        ],
        inputPlaceholder: 'Ask a follow-up...'
      },
      courseProgress: {
        percentage: 65,
        courseName: 'Programming Concepts',
        label: '65% Completed'
      },
      xpStats: {
        earned: 50,
        total: 2450
      },
      relatedSubtopics: [],
      laymanSidebar: {
        quickSummary: [],
        keyTerms: [],
        readingTime: '',
        thinkAboutIt: ''
      },
      deepDiveSidebar: {
        onThisPage: [],
        quickLinks: []
      }
    }
  };

  const sectionToTabMap: Record<string, string> = {
    overview: 'overview',
    notes: 'notes',
    layman: 'layman',
    'real-life': 'real-life',
    'technical-deep-dive': 'technical-deep-dive',
    'code-example': 'code-example',
    'visual-explanation': 'visual-explanation',
    'practice-test': 'practice-test',
    assignments: 'assignments',
    project: 'project',
    quiz: 'quiz',
    summary: 'summary',
    interview: 'interview',
  };
  const activeInitialTab = sectionToTabMap[selectedSection] || 'notes';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={toggleRightSidebar} 
      />
      
      {/* Sidebar Panel */}
      <div className="relative w-screen bg-slate-55 flex flex-col h-full shadow-2xl border-l border-slate-200 overflow-hidden animate-slide-in">
        
        {/* Top Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
              <Sparkles size={20} className="animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-outfit">Interactive Visual Page Editor</h2>
              <p className="text-xs text-slate-550 font-semibold mt-0.5">
                Active Subtopic: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{subtopicId || 'N/A'}</span>
                {' '}&bull;{' '}
                Section: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{selectedSectionLabel}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isInlineSaving && (
              <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                <RefreshCw className="animate-spin" size={14} /> Synced Background DB...
              </span>
            )}
            <button
              onClick={toggleRightSidebar}
              className="p-3 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              title="Close Editor Panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Editor Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          {parseError ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
              <AlertTriangle className="text-red-500 w-12 h-12" />
              <h3 className="text-lg font-bold text-red-800">JSON Parsing Error</h3>
              <p className="text-xs text-red-700/80 font-mono bg-red-100/50 p-4 rounded-xl border border-red-200/50 w-full max-w-md">
                {parseError}
              </p>
              <p className="text-xs text-slate-500">
                Please resolve the syntax errors in your JSON Workspace Editor input to display the page in interactive editable mode.
              </p>
            </div>
          ) : !jsonInput.trim() ? (
            <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
              <HelpCircle className="text-blue-500 w-12 h-12" />
              <h3 className="text-lg font-bold text-blue-800">No Content Loaded</h3>
              <p className="text-xs text-slate-655">
                Fetch current content from the database or enter a JSON payload to start visually editing and mapping components.
              </p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {/* Component Quick Adder */}
              {selectedSection === 'notes' && (
                <div className="max-w-4xl mx-auto">
                  <ComponentCreator
                    newComponentType={newComponentType}
                    setNewComponentType={setNewComponentType}
                    onAddComponent={handleAddComponent}
                  />
                </div>
              )}

              {/* Render High-Fidelity Student Learning View Page */}
              <div className="border border-slate-200 rounded-[32px] overflow-hidden bg-white shadow-2xl relative min-h-[750px] w-full">
                <SubtopicNotesPage
                  subtopicId={subtopicId}
                  notesData={mockNotesData}
                  overviewData={mockOverviewData}
                  initialTab={activeInitialTab}
                  isEditable={true}
                  onEditComponent={handleStartEdit}
                  onDeleteComponent={handleDeleteComponent}
                />
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal Popup */}
        {editingFieldKey && editingFieldData !== null && (
          <EditComponentModal
            editingFieldKey={editingFieldKey}
            editingFieldData={editingFieldData}
            setEditingFieldData={setEditingFieldData}
            onClose={() => {
              setEditingFieldKey(null);
              setEditingFieldData(null);
            }}
            onSave={handleSaveEdit}
            isSaving={isInlineSaving}
          />
        )}
      </div>
    </div>
  );
}
