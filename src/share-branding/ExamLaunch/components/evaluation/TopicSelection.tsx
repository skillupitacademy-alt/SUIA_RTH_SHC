import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Check, AlertCircle } from 'lucide-react';


interface Topic {
  id: string;
  title: string;
  subtopicCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  parentSubjectId: string;
}

// Hierarchical topic data based on subject selection
const topicsBySubject: Record<string, Topic[]> = {
  frontend: [
    { id: 'react', title: 'React', subtopicCount: 12, difficulty: 'Intermediate', parentSubjectId: 'frontend' },
    { id: 'vue', title: 'Vue.js', subtopicCount: 10, difficulty: 'Intermediate', parentSubjectId: 'frontend' },
    { id: 'html-css', title: 'HTML & CSS', subtopicCount: 15, difficulty: 'Beginner', parentSubjectId: 'frontend' },
    { id: 'javascript', title: 'JavaScript', subtopicCount: 18, difficulty: 'Intermediate', parentSubjectId: 'frontend' },
    { id: 'typescript', title: 'TypeScript', subtopicCount: 14, difficulty: 'Advanced', parentSubjectId: 'frontend' },
    { id: 'responsive', title: 'Responsive Design', subtopicCount: 11, difficulty: 'Beginner', parentSubjectId: 'frontend' },
  ],
  backend: [
    { id: 'nodejs', title: 'Node.js', subtopicCount: 15, difficulty: 'Intermediate', parentSubjectId: 'backend' },
    { id: 'python', title: 'Python', subtopicCount: 13, difficulty: 'Beginner', parentSubjectId: 'backend' },
    { id: 'rest-api', title: 'REST API', subtopicCount: 10, difficulty: 'Intermediate', parentSubjectId: 'backend' },
    { id: 'auth', title: 'Authentication', subtopicCount: 12, difficulty: 'Advanced', parentSubjectId: 'backend' },
    { id: 'microservices', title: 'Microservices', subtopicCount: 16, difficulty: 'Advanced', parentSubjectId: 'backend' },
  ],
  database: [
    { id: 'sql', title: 'SQL', subtopicCount: 14, difficulty: 'Beginner', parentSubjectId: 'database' },
    { id: 'nosql', title: 'NoSQL', subtopicCount: 11, difficulty: 'Intermediate', parentSubjectId: 'database' },
    { id: 'optimization', title: 'Query Optimization', subtopicCount: 9, difficulty: 'Advanced', parentSubjectId: 'database' },
    { id: 'modeling', title: 'Data Modeling', subtopicCount: 13, difficulty: 'Intermediate', parentSubjectId: 'database' },
  ],
};

interface TopicSelectionProps {
  subjects: any[];
  selected: Topic[];
  onSelect: (topics: Topic[]) => void;
  maxSelections?: number;
}

export function TopicSelection({ subjects, selected, onSelect, maxSelections = 4 }: TopicSelectionProps) {
  const brandConfig = useBrand();

  // Get all topics from selected subjects
  const availableTopics = subjects.flatMap((subject) => topicsBySubject[subject.id] || []);

  const toggleTopic = (topic: Topic) => {
    const isSelected = selected.some((t) => t.id === topic.id);
    if (isSelected) {
      onSelect(selected.filter((t) => t.id !== topic.id));
    } else {
      if (selected.length < maxSelections) {
        onSelect([...selected, topic]);
      }
    }
  };

  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-700',
    Intermediate: 'bg-blue-100 text-blue-700',
    Advanced: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Topics</h2>
        <p className="text-slate-600">Choose up to {maxSelections} topics to focus on</p>
      </div>

      {selected.length >= maxSelections && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Maximum topics reached</p>
            <p className="text-sm text-amber-700">Deselect a topic to choose a different one</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-3">
          {availableTopics.map((topic) => {
            const isSelected = selected.some((t) => t.id === topic.id);
            const isDisabled = !isSelected && selected.length >= maxSelections;

            return (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic)}
                disabled={isDisabled}
                className={`rounded-full px-4 py-2 border font-bold transition-all hover:shadow-md ${
                  isSelected
                    ? 'bg-[#d81b60] text-white border-[#d81b60]'
                    : isDisabled
                    ? 'bg-gray-50 border-gray-200 text-slate-400 cursor-not-allowed opacity-50'
                    : 'bg-white border-gray-200 text-slate-700'
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
                  <span>{topic.title}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                  <span className="text-xs opacity-75">({topic.subtopicCount})</span>
                </div>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              <span className="font-medium">
                {selected.length} of {maxSelections} topics selected
              </span>
              {' '}- {maxSelections - selected.length} remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
