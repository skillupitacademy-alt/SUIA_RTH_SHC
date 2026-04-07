import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Play, Bot, BarChart, AlertCircle, Calendar, Folder, CheckCircle, Lock, Circle } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'locked';
  subtopics?: Topic[];
}

interface SidebarProps {
  onAITutorClick: () => void;
  onSectionScroll: (sectionId: string) => void;
  
}

export const Sidebar: React.FC<SidebarProps> = ({ onAITutorClick, onSectionScroll }) => {
  const brandConfig = useBrand();

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['topic-1']));
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { label: 'Continue', icon: Play, action: () => onSectionScroll('learner-flow') },
    { label: brandConfig.tutorLabel, icon: Bot, action: onAITutorClick },
    { label: 'Progress', icon: BarChart, action: () => onSectionScroll('learner-flow') },
    { label: 'Weak Areas', icon: AlertCircle, action: () => {} },
    { label: 'Sessions', icon: Calendar, action: () => onSectionScroll('live-session') },
    { label: 'Projects', icon: Folder, action: () => onSectionScroll('projects') },
  ];

  const curriculumTopics: Topic[] = [
    {
      id: 'topic-1',
      name: 'Introduction to React',
      status: 'completed',
      subtopics: [
        { id: 'sub-1-1', name: 'What is React?', status: 'completed' },
        { id: 'sub-1-2', name: 'JSX Basics', status: 'completed' },
      ],
    },
    {
      id: 'topic-2',
      name: 'Component Architecture',
      status: 'active',
      subtopics: [
        { id: 'sub-2-1', name: 'Functional Components', status: 'completed' },
        { id: 'sub-2-2', name: 'Props & State', status: 'active' },
        { id: 'sub-2-3', name: 'Lifecycle Methods', status: 'locked' },
      ],
    },
    {
      id: 'topic-3',
      name: 'Hooks Deep Dive',
      status: 'locked',
      subtopics: [
        { id: 'sub-3-1', name: 'useState', status: 'locked' },
        { id: 'sub-3-2', name: 'useEffect', status: 'locked' },
      ],
    },
  ];

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowScrollUp(scrollTop > 10);
      setShowScrollDown(scrollTop < scrollHeight - clientHeight - 10);
    }
  };

  const scrollTo = (direction: 'up' | 'down') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        top: direction === 'down' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const getStatusIcon = (status: Topic['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'active':
        return <Circle className="w-4 h-4 fill-current" style={{ color: brandConfig.primaryColor }} />;
      case 'locked':
        return <Lock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed left-0 top-[98px] bottom-0 w-[260px] p-4 overflow-hidden flex flex-col">
      <div
        className="rounded-lg p-5 flex-1 flex flex-col overflow-hidden bg-white border border-gray-200 shadow-sm"
      >
        {/* Quick Actions Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                className="p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:bg-gray-50 bg-white border border-gray-200"
              >
                <action.icon className="w-5 h-5" style={{ color: brandConfig.primaryColor }} />
                <span className="text-xs text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Curriculum Explorer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Curriculum
            </h3>
            <div className="flex gap-1">
              {showScrollUp && (
                <button
                  onClick={() => scrollTo('up')}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                </button>
              )}
              {showScrollDown && (
                <button
                  onClick={() => scrollTo('down')}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar">
            <div className="space-y-1">
              {curriculumTopics.map((topic) => (
                <div key={topic.id}>
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    {getStatusIcon(topic.status)}
                    <span className="flex-1 text-sm text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {topic.name}
                    </span>
                    {topic.subtopics && (
                      <ChevronDown
                        className={`w-4 h-4 text-gray-600 transition-transform ${
                          expandedTopics.has(topic.id) ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {topic.subtopics && expandedTopics.has(topic.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {topic.subtopics.map((subtopic) => (
                        <div key={subtopic.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          {getStatusIcon(subtopic.status)}
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
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

        {/* Glossary Card */}
        <div
          className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200"
        >
          <h4 className="text-sm font-semibold mb-2 text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            📝 Key Terms
          </h4>
          <p className="text-xs text-gray-700" style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
            <strong>JSX:</strong> JavaScript XML syntax extension
            <br />
            <strong>Props:</strong> Data passed to components
          </p>
        </div>
      </div>
    </div>
  );
};