import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Check } from 'lucide-react';


interface Subject {
  id: string;
  title: string;
  topicCount: number;
}

// Hierarchical subject data based on domain selection
const subjectsByDomain: Record<string, Subject[]> = {
  fullstack: [
    { id: 'frontend', title: 'Front End Development', topicCount: 45 },
    { id: 'backend', title: 'Back End Development', topicCount: 38 },
    { id: 'database', title: 'Database Architecture', topicCount: 52 },
    { id: 'api', title: 'API Design & Integration', topicCount: 34 },
    { id: 'testing', title: 'Testing & QA', topicCount: 28 },
    { id: 'deployment', title: 'Deployment & Hosting', topicCount: 24 },
  ],
  datascience: [
    { id: 'ml', title: 'Machine Learning', topicCount: 48 },
    { id: 'stats', title: 'Statistical Analysis', topicCount: 44 },
    { id: 'visualization', title: 'Data Visualization', topicCount: 32 },
    { id: 'nlp', title: 'Natural Language Processing', topicCount: 36 },
  ],
  dataeng: [
    { id: 'pipelines', title: 'Data Pipelines', topicCount: 40 },
    { id: 'etl', title: 'ETL Processes', topicCount: 35 },
    { id: 'warehousing', title: 'Data Warehousing', topicCount: 38 },
    { id: 'streaming', title: 'Stream Processing', topicCount: 30 },
  ],
  cybersecurity: [
    { id: 'netsec', title: 'Network Security', topicCount: 42 },
    { id: 'appsec', title: 'Application Security', topicCount: 38 },
    { id: 'pentesting', title: 'Penetration Testing', topicCount: 35 },
    { id: 'compliance', title: 'Compliance & Governance', topicCount: 28 },
  ],
};

interface SubjectSelectionProps {
  domain: any;
  selected: Subject[];
  onSelect: (subjects: Subject[]) => void;
}

export function SubjectSelection({ domain, selected, onSelect }: SubjectSelectionProps) {
  const brandConfig = useBrand();

  const subjects = subjectsByDomain[domain?.id] || [];

  const toggleSubject = (subject: Subject) => {
    const isSelected = selected.some((s) => s.id === subject.id);
    if (isSelected) {
      onSelect(selected.filter((s) => s.id !== subject.id));
    } else {
      onSelect([...selected, subject]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Subjects</h2>
        <p className="text-slate-600">Choose one or more subjects within {domain?.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-3">
          {subjects.map((subject) => {
            const isSelected = selected.some((s) => s.id === subject.id);

            return (
              <button
                key={subject.id}
                onClick={() => toggleSubject(subject)}
                className={`rounded-full px-4 py-2 border font-bold text-slate-700 transition-all hover:shadow-md ${
                  isSelected
                    ? 'bg-[#d81b60] text-white border-[#d81b60]'
                    : 'bg-white border-gray-200'
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
                  <span>{subject.title}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                  <span className="text-xs opacity-75">({subject.topicCount})</span>
                </div>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              <span className="font-medium">
                {selected.length} subject{selected.length > 1 ? 's' : ''} selected
              </span>
              {' '}- You can select multiple subjects to combine topics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
