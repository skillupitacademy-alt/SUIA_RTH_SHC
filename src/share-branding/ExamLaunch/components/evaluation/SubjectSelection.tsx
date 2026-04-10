import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Check } from 'lucide-react';
import { useLaunchData } from '../LaunchDataContext';

interface SubjectSelectionProps {
  domain: any;
  selected: any[];
  onSelect: (subjects: any[]) => void;
}

export function SubjectSelection({ domain, selected, onSelect }: SubjectSelectionProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();
  const subjects = data.subjectSelection.subjectsByDomain[domain?.id] || [];

  const toggleSubject = (subject: any) => {
    const isSelected = selected.some((s) => s.id === subject.id);
    onSelect(isSelected ? selected.filter((s) => s.id !== subject.id) : [...selected, subject]);
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div className="mb-6 min-w-0">
        <h2 className="mb-2 break-words text-2xl font-bold text-slate-800">{data.subjectSelection.title}</h2>
        <p className="break-words text-slate-600">
          {data.subjectSelection.descriptionPrefix} {domain?.title}
        </p>
      </div>

      <div className="w-full min-w-0 flex-1 overflow-y-auto">
        <div className="flex w-full min-w-0 flex-wrap gap-3">
          {subjects.map((subject) => {
            const isSelected = selected.some((s) => s.id === subject.id);

            return (
              <button
                key={subject.id}
                onClick={() => toggleSubject(subject)}
                className={`max-w-full min-w-0 rounded-full border px-4 py-2 font-bold text-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] ${
                  isSelected ? 'text-white' : 'border-gray-200 bg-white'
                }`}
                style={isSelected ? { backgroundColor: brandConfig.primaryColor, borderColor: brandConfig.primaryColor } : {}}
              >
                <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                  <span className="max-w-full break-words text-left">{subject.title}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  <span className="shrink-0 text-xs opacity-75">({subject.topicCount})</span>
                </div>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <span className="font-medium">{selected.length} subject{selected.length > 1 ? 's' : ''} selected</span> - {data.subjectSelection.helperText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
