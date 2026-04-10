import { Check, CircuitBoard, Compass, FolderTree, Shapes } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { useLaunchData } from '../LaunchDataContext';
import { LaunchSubtopic, LaunchTopic } from '../../../launchExamPageData';

interface SubtopicSelectionProps {
  topics: LaunchTopic[];
  selected: LaunchSubtopic[];
  onSelect: (subtopics: LaunchSubtopic[]) => void;
}

const subtopicIcons = [CircuitBoard, Shapes, FolderTree, Compass];

const subtopicPalette = [
  {
    surface: '#FAFAF9',
    border: '#D6D3D1',
    iconSurface: 'linear-gradient(135deg, #78716C 0%, #A8A29E 100%)',
    pillSurface: '#F5F5F4',
    text: '#111827',
    muted: '#57534E',
    accent: '#57534E',
  },
  {
    surface: '#F7FEE7',
    border: '#D9F99D',
    iconSurface: 'linear-gradient(135deg, #6B7280 0%, #84CC16 100%)',
    pillSurface: '#ECFCCB',
    text: '#111827',
    muted: '#4B5563',
    accent: '#4D7C0F',
  },
  {
    surface: '#FFF7ED',
    border: '#FED7AA',
    iconSurface: 'linear-gradient(135deg, #9A3412 0%, #C2410C 100%)',
    pillSurface: '#FFEDD5',
    text: '#111827',
    muted: '#7C2D12',
    accent: '#9A3412',
  },
  {
    surface: '#F1F5F9',
    border: '#CBD5E1',
    iconSurface: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
    pillSurface: '#E2E8F0',
    text: '#111827',
    muted: '#475569',
    accent: '#1E293B',
  },
];

export function SubtopicSelection({ topics, selected, onSelect }: SubtopicSelectionProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();
  const topicTitleMap = Object.fromEntries(topics.map((topic) => [topic.id, topic.title]));
  const availableSubtopics = topics.flatMap((topic) => data.subtopicSelection.subtopicsByTopic[topic.id] || []);

  const toggleSubtopic = (subtopic: LaunchSubtopic) => {
    const isSelected = selected.some((s) => s.id === subtopic.id);
    onSelect(isSelected ? selected.filter((s) => s.id !== subtopic.id) : [...selected, subtopic]);
  };

  const helperText = data.subtopicSelection.helperText
    .replace('{selected}', String(selected.length))
    .replace('{topicCount}', String(topics.length));

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col">
      <div className="flex w-full min-w-0 flex-wrap justify-center gap-4 sm:gap-5 xl:gap-6">
        {availableSubtopics.map((subtopic, index) => {
          const isSelected = selected.some((s) => s.id === subtopic.id);
          const palette = subtopicPalette[index % subtopicPalette.length];
          const Icon = subtopicIcons[index % subtopicIcons.length];

          return (
            <button
              key={subtopic.id}
              onClick={() => toggleSubtopic(subtopic)}
              className={`group min-w-0 w-full flex-1 basis-full overflow-hidden rounded-[1.75rem] border-2 p-5 text-left transition-all duration-300 hover:-translate-y-1.5 md:min-h-[220px] md:basis-[calc(50%-0.625rem)] 2xl:basis-[calc(33.333%-1rem)] sm:p-6 xl:p-7 ${
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
                  {topicTitleMap[subtopic.parentTopicId] ?? 'Topic'}
                </div>
                <div
                  className="max-w-full rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm sm:px-4"
                  style={{
                    backgroundColor: palette.pillSurface,
                    color: palette.accent,
                  }}
                >
                  {`${subtopic.questionCount} Questions`}
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
                        {subtopic.title}
                      </h3>
                    </div>
                    <p className="max-w-[30rem] break-words text-[14px] leading-7 sm:text-[15px] sm:leading-8" style={{ color: palette.muted }}>
                      A focused subtopic track with {subtopic.questionCount} mapped questions.
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3">
                    <span className="pr-2 text-xs font-medium leading-5 text-slate-600">
                      {isSelected ? 'Queued for the assessment blueprint' : 'Optional subtopic selection'}
                    </span>
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{
                        backgroundColor: isSelected ? `${brandConfig.primaryColor}18` : '#FFFFFF',
                        color: isSelected ? brandConfig.primaryColorDark : palette.accent,
                      }}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                      {isSelected ? 'Selected' : `${subtopic.questionCount} Questions`}
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
  );
}
