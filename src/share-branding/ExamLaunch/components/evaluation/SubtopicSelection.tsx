import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Check } from 'lucide-react';


interface Subtopic {
  id: string;
  title: string;
  questionCount: number;
  parentTopicId: string;
}

// Hierarchical subtopic data based on topic selection
const subtopicsByTopic: Record<string, Subtopic[]> = {
  react: [
    { id: 'react-1', title: 'Components & Props', questionCount: 24, parentTopicId: 'react' },
    { id: 'react-2', title: 'State Management', questionCount: 28, parentTopicId: 'react' },
    { id: 'react-3', title: 'Hooks', questionCount: 32, parentTopicId: 'react' },
    { id: 'react-4', title: 'Context API', questionCount: 26, parentTopicId: 'react' },
    { id: 'react-5', title: 'Performance Optimization', questionCount: 30, parentTopicId: 'react' },
  ],
  javascript: [
    { id: 'js-1', title: 'ES6+ Features', questionCount: 35, parentTopicId: 'javascript' },
    { id: 'js-2', title: 'Async/Await', questionCount: 28, parentTopicId: 'javascript' },
    { id: 'js-3', title: 'Closures & Scope', questionCount: 24, parentTopicId: 'javascript' },
    { id: 'js-4', title: 'Prototypes & Inheritance', questionCount: 30, parentTopicId: 'javascript' },
  ],
  nodejs: [
    { id: 'node-1', title: 'Express.js Framework', questionCount: 32, parentTopicId: 'nodejs' },
    { id: 'node-2', title: 'Event Loop', questionCount: 20, parentTopicId: 'nodejs' },
    { id: 'node-3', title: 'File System Operations', questionCount: 25, parentTopicId: 'nodejs' },
    { id: 'node-4', title: 'Middleware', questionCount: 28, parentTopicId: 'nodejs' },
  ],
  sql: [
    { id: 'sql-1', title: 'SELECT Queries', questionCount: 30, parentTopicId: 'sql' },
    { id: 'sql-2', title: 'JOINs', questionCount: 35, parentTopicId: 'sql' },
    { id: 'sql-3', title: 'Indexes & Performance', questionCount: 28, parentTopicId: 'sql' },
    { id: 'sql-4', title: 'Transactions', questionCount: 24, parentTopicId: 'sql' },
  ],
};

interface SubtopicSelectionProps {
  topics: any[];
  selected: Subtopic[];
  onSelect: (subtopics: Subtopic[]) => void;
}

export function SubtopicSelection({ topics, selected, onSelect }: SubtopicSelectionProps) {
  const brandConfig = useBrand();

  const toggleSubtopic = (subtopic: Subtopic) => {
    const isSelected = selected.some((s) => s.id === subtopic.id);
    if (isSelected) {
      onSelect(selected.filter((s) => s.id !== subtopic.id));
    } else {
      onSelect([...selected, subtopic]);
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto">
      <div className="mb-6 min-w-0">
        <h2 className="mb-2 break-words text-2xl font-bold text-slate-800">Select Subtopics</h2>
        <p className="break-words text-slate-600">Refine your focus by selecting specific subtopics</p>
      </div>

      <div className="w-full min-w-0 space-y-6">
        {topics.map((topic) => {
          const subtopics = subtopicsByTopic[topic.id] || [];
          if (subtopics.length === 0) return null;

          const selectedInTopic = selected.filter((s) => s.parentTopicId === topic.id).length;

          return (
            <div key={topic.id} className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] sm:p-6">
              <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="break-words text-lg font-bold text-slate-900">{topic.title}</h3>
                <span className="text-sm text-slate-500">
                  {selectedInTopic} of {subtopics.length} selected
                </span>
              </div>

              <div className="flex w-full min-w-0 flex-wrap gap-3">
                {subtopics.map((subtopic) => {
                  const isSelected = selected.some((s) => s.id === subtopic.id);

                  return (
                    <button
                      key={subtopic.id}
                      onClick={() => toggleSubtopic(subtopic)}
                      className={`max-w-full min-w-0 rounded-full border px-4 py-2 font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] ${
                        isSelected
                          ? 'border-[#d81b60] bg-[#d81b60] text-white'
                          : 'border-gray-200 bg-white text-slate-700'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: brandConfig.primaryColor,
                              borderColor: brandConfig.primaryColor,
                              color: 'white',
                            }
                          : {}
                      }
                    >
                      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                        <span className="max-w-full break-words text-left">{subtopic.title}</span>
                        {isSelected && <Check className="h-3 w-3 shrink-0" />}
                        <span className="shrink-0 text-xs opacity-75">({subtopic.questionCount})</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <span className="font-medium">
              {selected.length} subtopic{selected.length > 1 ? 's' : ''} selected
            </span>
            {' '}across {topics.length} topic{topics.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
