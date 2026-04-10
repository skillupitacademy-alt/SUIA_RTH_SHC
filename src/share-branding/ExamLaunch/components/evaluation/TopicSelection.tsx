import { AlertCircle, Check, Compass, Layers3, Orbit, Sparkles } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { useLaunchData } from '../LaunchDataContext';
import { LaunchSubject, LaunchTopic } from '../../../launchExamPageData';

interface TopicSelectionProps {
  subjects: LaunchSubject[];
  selected: LaunchTopic[];
  onSelect: (topics: LaunchTopic[]) => void;
  maxSelections?: number;
}

const topicIcons = [Compass, Layers3, Orbit, Sparkles];

const topicPalette = [
  {
    surface: '#EEF2FF',
    border: '#C7D2FE',
    iconSurface: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
    pillSurface: '#E0E7FF',
    text: '#111827',
    muted: '#4B5563',
    accent: '#4338CA',
  },
  {
    surface: '#ECFEFF',
    border: '#A5F3FC',
    iconSurface: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
    pillSurface: '#CFFAFE',
    text: '#111827',
    muted: '#4B5563',
    accent: '#0E7490',
  },
  {
    surface: '#F7FEE7',
    border: '#D9F99D',
    iconSurface: 'linear-gradient(135deg, #4D7C0F 0%, #84CC16 100%)',
    pillSurface: '#ECFCCB',
    text: '#111827',
    muted: '#4B5563',
    accent: '#4D7C0F',
  },
  {
    surface: '#F8FAFC',
    border: '#CBD5E1',
    iconSurface: 'linear-gradient(135deg, #475569 0%, #64748B 100%)',
    pillSurface: '#E2E8F0',
    text: '#111827',
    muted: '#475569',
    accent: '#475569',
  },
];

export function TopicSelection({ subjects, selected, onSelect, maxSelections = 4 }: TopicSelectionProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();
  const availableTopics = subjects.flatMap((subject) => data.topicSelection.topicsBySubject[subject.id] || []);
  const subjectTitleMap = Object.fromEntries(subjects.map((subject) => [subject.id, subject.title]));

  const toggleTopic = (topic: LaunchTopic) => {
    const isSelected = selected.some((t) => t.id === topic.id);
    if (isSelected) {
      onSelect(selected.filter((t) => t.id !== topic.id));
      return;
    }

    if (selected.length < maxSelections) {
      onSelect([...selected, topic]);
    }
  };

  const helperText = data.topicSelection.helperFormat
    .replace('{selected}', String(selected.length))
    .replace('{maxSelections}', String(maxSelections))
    .replace('{remaining}', String(maxSelections - selected.length));

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col">
      {selected.length >= maxSelections && (
        <div className="mb-4 flex min-w-0 items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">{data.topicSelection.limitTitle}</p>
            <p className="text-sm text-amber-700">{data.topicSelection.limitDescription}</p>
          </div>
        </div>
      )}

      <div className="w-full min-w-0 flex-1">
        <div className="flex w-full min-w-0 flex-wrap justify-center gap-4 sm:gap-5 xl:gap-6">
          {availableTopics.map((topic, index) => {
            const isSelected = selected.some((t) => t.id === topic.id);
            const isDisabled = !isSelected && selected.length >= maxSelections;
            const palette = topicPalette[index % topicPalette.length];
            const Icon = topicIcons[index % topicIcons.length];

            return (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic)}
                disabled={isDisabled}
                className={`group min-w-0 w-full flex-1 basis-full overflow-hidden rounded-[1.75rem] border-2 p-5 text-left transition-all duration-300 md:min-h-[220px] md:basis-[calc(50%-0.625rem)] 2xl:basis-[calc(33.333%-1rem)] sm:p-6 xl:p-7 ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-55'
                    : 'hover:-translate-y-1.5'
                } ${
                  isSelected
                    ? 'shadow-[0_28px_60px_rgba(15,23,42,0.22),0_12px_24px_rgba(15,23,42,0.12)]'
                    : 'shadow-[0_20px_42px_rgba(15,23,42,0.14),0_8px_18px_rgba(15,23,42,0.08)] hover:shadow-[0_34px_70px_rgba(15,23,42,0.2),0_12px_24px_rgba(15,23,42,0.12)]'
                }`}
                style={{
                  borderColor: isSelected ? brandConfig.primaryColor : palette.border,
                  background: palette.surface,
                  boxShadow: isSelected
                    ? `inset 0 0 0 1px ${brandConfig.primaryColor}, 0 28px 60px rgba(15,23,42,0.22), 0 12px 24px rgba(15,23,42,0.12)`
                    : undefined,
                }}
              >
                <div className="mb-5 flex min-w-0 justify-end gap-2 sm:mb-6">
                  <div
                    className="max-w-full rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm sm:px-4"
                    style={{
                      backgroundColor: palette.pillSurface,
                      color: palette.accent,
                    }}
                  >
                    {subjectTitleMap[topic.parentSubjectId] ?? 'Subject'}
                  </div>
                  <div
                    className="max-w-full rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm sm:px-4"
                    style={{
                      backgroundColor: palette.pillSurface,
                      color: palette.accent,
                    }}
                  >
                    {topic.difficulty}
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex min-w-0 items-start gap-4 sm:gap-5 xl:gap-6">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner sm:h-16 sm:w-16"
                      style={{
                        background: isSelected ? `linear-gradient(135deg, ${brandConfig.primaryColor} 0%, ${brandConfig.primaryColorDark} 100%)` : palette.iconSurface,
                      }}
                    >
                      <Icon className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex min-w-0 items-center gap-3">
                        <h3 className="min-w-0 break-words text-[1rem] font-black leading-[1.15] tracking-tight sm:text-[1.08rem] xl:text-[1.18rem]" style={{ color: palette.text }}>
                          {topic.title}
                        </h3>
                      </div>
                      <p className="max-w-[30rem] break-words text-[14px] leading-7 sm:text-[15px] sm:leading-8" style={{ color: palette.muted }}>
                        {topic.subtopicCount} subtopics are available inside this topic track.
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3">
                      <span className="pr-2 text-xs font-medium leading-5 text-slate-600">
                        {isSelected ? 'Added to selected topic stack' : `${topic.difficulty} difficulty track`}
                      </span>
                      <span
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{
                          backgroundColor: isSelected ? `${brandConfig.primaryColor}18` : '#FFFFFF',
                          color: isSelected ? brandConfig.primaryColorDark : palette.accent,
                        }}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                        {isSelected ? 'Selected' : `${topic.subtopicCount} Subtopics`}
                      </span>
                    </div>
                  </div>
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
