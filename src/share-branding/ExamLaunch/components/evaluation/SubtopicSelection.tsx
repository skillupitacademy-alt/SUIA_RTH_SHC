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
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Subtopics</h2>
        <p className="text-slate-600">Refine your focus by selecting specific subtopics</p>
      </div>

      <div className="space-y-6">
        {topics.map((topic) => {
          const subtopics = subtopicsByTopic[topic.id] || [];
          if (subtopics.length === 0) return null;

          const selectedInTopic = selected.filter((s) => s.parentTopicId === topic.id).length;

          return (
            <div key={topic.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">{topic.title}</h3>
                <span className="text-sm text-slate-500">
                  {selectedInTopic} of {subtopics.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {subtopics.map((subtopic) => {
                  const isSelected = selected.some((s) => s.id === subtopic.id);

                  return (
                    <button
                      key={subtopic.id}
                      onClick={() => toggleSubtopic(subtopic)}
                      className={`rounded-full px-4 py-2 border font-bold transition-all hover:shadow-md ${
                        isSelected
                          ? 'bg-[#d81b60] text-white border-[#d81b60]'
                          : 'bg-gray-50 border-gray-200 text-slate-700'
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
                      <div className="flex items-center gap-2">
                        <span>{subtopic.title}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                        <span className="text-xs opacity-75">({subtopic.questionCount})</span>
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
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
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
