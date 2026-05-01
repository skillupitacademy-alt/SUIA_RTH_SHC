import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Play, Bot, BarChart, AlertCircle, Calendar, Folder, CheckCircle, Lock, Circle } from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialData } from './TutorialDataContext';

interface SidebarProps {
  onAITutorClick: () => void;
  onSectionScroll: (sectionId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAITutorClick, onSectionScroll, isOpen, onClose }) => {
  const brandConfig = useBrand();
  const data = useTutorialData();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['topic-1']));
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const iconMap = {
    Continue: Play,
    Progress: BarChart,
    'Weak Areas': AlertCircle,
    Sessions: Calendar,
    Projects: Folder,
  } as const;

  const quickActions = data.sidebar.quickActions.map((action) => ({
    ...action,
    icon: action.label === brandConfig.tutorLabel ? Bot : iconMap[action.label as keyof typeof iconMap] ?? Play,
    handler: () => {
      if (action.target === 'ai-tutor') {
        onAITutorClick();
        return;
      }
      onSectionScroll(action.target);
    },
  }));

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const checkScroll = () => {
    if (!scrollRef.current) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollUp(scrollTop > 10);
    setShowScrollDown(scrollTop < scrollHeight - clientHeight - 10);
  };

  const scrollTo = (direction: 'up' | 'down') => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollBy({
      top: direction === 'down' ? 300 : -300,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (!ref) {
      return;
    }
    ref.addEventListener('scroll', checkScroll);
    return () => ref.removeEventListener('scroll', checkScroll);
  }, []);

  const getStatusIcon = (status: 'completed' | 'active' | 'locked') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'active':
        return <Circle className="h-4 w-4 fill-current" style={{ color: brandConfig.primaryColor }} />;
      case 'locked':
        return <Lock className="h-4 w-4 text-slate-700" />;
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside aria-label="Tutorial curriculum menu" className={`fixed bottom-0 left-0 top-[80px] z-[50] flex w-[calc(100vw-1rem)] max-w-[280px] min-w-0 flex-col overflow-hidden p-2 transition-transform duration-300 sm:top-[98px] sm:p-4 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:p-5 lg:shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 lg:hidden">
            <span className="font-bold text-slate-950">Tutorial Menu</span>
            <button onClick={onClose} aria-label="Close tutorial menu" className="group rounded-lg p-2 transition-all hover:bg-slate-100 border border-transparent hover:border-slate-200">
              <Circle className="h-5 w-5 rotate-45 text-slate-700 group-hover:text-slate-950" />
            </button>
          </div>

          <div className="mb-6 min-w-0">
            <p className="mb-3 text-sm font-bold text-slate-800 uppercase tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {data.sidebar.quickActionsTitle}
            </p>
            <div className="grid min-w-0 grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.handler}
                  aria-label={`Quick Action: ${action.label}`}
                  className="flex w-full min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50 shadow-sm active:scale-95"
                >
                  <action.icon className="h-5 w-5" style={{ color: brandConfig.primaryColor }} aria-hidden="true" />
                  <span className="max-w-full break-words text-center text-xs font-bold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800 uppercase tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {data.sidebar.curriculumTitle}
              </p>
              <div className="flex gap-1">
                {showScrollUp && (
                  <button onClick={() => scrollTo('up')} aria-label="Scroll menu up" className="rounded p-1 transition-colors hover:bg-slate-100 border border-transparent hover:border-slate-200">
                    <ChevronUp className="h-4 w-4 text-slate-800" />
                  </button>
                )}
                {showScrollDown && (
                  <button onClick={() => scrollTo('down')} aria-label="Scroll menu down" className="rounded p-1 transition-colors hover:bg-slate-100 border border-transparent hover:border-slate-200">
                    <ChevronDown className="h-4 w-4 text-slate-800" />
                  </button>
                )}
              </div>
            </div>

            <div ref={scrollRef} tabIndex={0} aria-label="Curriculum topics" className="hide-scrollbar min-w-0 flex-1 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2">
              <div className="space-y-1">
                {data.sidebar.topics.map((topic) => (
                  <div key={topic.id}>
                    <button onClick={() => toggleTopic(topic.id)} aria-expanded={expandedTopics.has(topic.id)} aria-label={`Toggle topic: ${topic.name}`} className="flex w-full min-w-0 items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-slate-50 group">
                      {getStatusIcon(topic.status)}
                      <span className="min-w-0 flex-1 break-words text-sm font-bold text-slate-900 group-hover:text-slate-950" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {topic.name}
                      </span>
                      {topic.subtopics && <ChevronDown className={`h-4 w-4 text-slate-700 transition-transform ${expandedTopics.has(topic.id) ? 'rotate-180' : ''}`} aria-hidden="true" />}
                    </button>

                    {topic.subtopics && expandedTopics.has(topic.id) && (
                      <div className="ml-4 mt-1 min-w-0 space-y-1 sm:ml-6">
                        {topic.subtopics.map((subtopic) => (
                          <div key={subtopic.id} className="flex min-w-0 items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-50 cursor-pointer group">
                            {getStatusIcon(subtopic.status)}
                            <span className="min-w-0 break-words text-xs font-bold text-slate-800 group-hover:text-slate-950" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {subtopic.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="mt-4 min-w-0 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="mb-2 text-sm font-bold text-slate-900 uppercase tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {data.sidebar.glossaryTitle}
            </h2>
            <p className="break-words text-xs font-medium text-slate-950" style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: data.sidebar.glossaryHtml }} />
          </section>
        </div>
      </aside>
    </>
  );
};
