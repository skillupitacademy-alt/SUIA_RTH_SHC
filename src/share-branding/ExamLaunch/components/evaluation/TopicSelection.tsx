import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Check, AlertCircle } from 'lucide-react';
import { useLaunchData } from '../LaunchDataContext';

interface TopicSelectionProps {
  subjects: any[];
  selected: any[];
  onSelect: (topics: any[]) => void;
  maxSelections?: number;
}

export function TopicSelection({ subjects, selected, onSelect, maxSelections = 4 }: TopicSelectionProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();
  const availableTopics = subjects.flatMap((subject) => data.topicSelection.topicsBySubject[subject.id] || []);

  const toggleTopic = (topic: any) => {
    const isSelected = selected.some((t) => t.id === topic.id);
    if (isSelected) {
      onSelect(selected.filter((t) => t.id !== topic.id));
    } else if (selected.length < maxSelections) {
      onSelect([...selected, topic]);
    }
  };

  const helperText = data.topicSelection.helperFormat
    .replace('{selected}', String(selected.length))
    .replace('{maxSelections}', String(maxSelections))
    .replace('{remaining}', String(maxSelections - selected.length));

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col">
      <div className="mb-6 min-w-0">
        <h2 className="mb-2 break-words text-2xl font-bold text-slate-800">{data.topicSelection.title}</h2>
        <p className="break-words text-slate-600">{data.topicSelection.description.replace('{maxSelections}', String(maxSelections))}</p>
      </div>

      {selected.length >= maxSelections && (
        <div className="mb-4 flex min-w-0 items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">{data.topicSelection.limitTitle}</p>
            <p className="text-sm text-amber-700">{data.topicSelection.limitDescription}</p>
          </div>
        </div>
      )}

      <div className="w-full min-w-0 flex-1 overflow-y-auto">
        <div className="flex w-full min-w-0 flex-wrap gap-3">
          {availableTopics.map((topic) => {
            const isSelected = selected.some((t) => t.id === topic.id);
            const isDisabled = !isSelected && selected.length >= maxSelections;

            return (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic)}
                disabled={isDisabled}
                className={`max-w-full min-w-0 rounded-full border px-4 py-2 font-bold shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] ${
                  isSelected ? 'text-white' : isDisabled ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-slate-400 opacity-50' : 'border-gray-200 bg-white text-slate-700'
                }`}
                style={isSelected ? { backgroundColor: brandConfig.primaryColor, borderColor: brandConfig.primaryColor } : {}}
              >
                <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                  <span className="max-w-full break-words text-left">{topic.title}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  <span className="shrink-0 text-xs opacity-75">({topic.subtopicCount})</span>
                </div>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <span className="font-medium">{helperText}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
