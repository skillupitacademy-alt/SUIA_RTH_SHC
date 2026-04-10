import { BookOpen, LibraryBig, Workflow } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { useLaunchData } from '../LaunchDataContext';
import { LaunchDomain, LaunchSubject } from '../../../launchExamPageData';

interface SubjectSelectionProps {
  domain: LaunchDomain | null;
  selected: LaunchSubject[];
  onSelect: (subjects: LaunchSubject[]) => void;
}

const subjectIcons = [BookOpen, LibraryBig, Workflow];

export function SubjectSelection({ domain, selected, onSelect }: SubjectSelectionProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();
  const subjects: LaunchSubject[] = domain ? data.subjectSelection.subjectsByDomain[domain.id] ?? [] : [];
  const adaptiveLoopPalette = [
    {
      surface: '#FFF7ED',
      border: '#FED7AA',
      iconSurface: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
      pillSurface: '#FFEDD5',
      text: '#111827',
      muted: '#4B5563',
      accent: '#C2410C',
    },
    {
      surface: '#F0FDF4',
      border: '#BBF7D0',
      iconSurface: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
      pillSurface: '#DCFCE7',
      text: '#111827',
      muted: '#4B5563',
      accent: '#15803D',
    },
    {
      surface: '#FAF5FF',
      border: '#E9D5FF',
      iconSurface: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
      pillSurface: '#F3E8FF',
      text: '#111827',
      muted: '#4B5563',
      accent: '#7E22CE',
    },
    {
      surface: '#EFF6FF',
      border: '#BFDBFE',
      iconSurface: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
      pillSurface: '#DBEAFE',
      text: '#111827',
      muted: '#4B5563',
      accent: '#1D4ED8',
    },
  ];

  const toggleSubject = (subject: LaunchSubject) => {
    const isSelected = selected.some((s) => s.id === subject.id);
    onSelect(isSelected ? selected.filter((s) => s.id !== subject.id) : [...selected, subject]);
  };

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col">
      <div className="flex w-full min-w-0 flex-wrap justify-center gap-4 sm:gap-5 xl:gap-6">
        {subjects.map((subject, index) => {
          const Icon = subjectIcons[index % subjectIcons.length];
          const isSelected = selected.some((s) => s.id === subject.id);
          const palette = adaptiveLoopPalette[index % adaptiveLoopPalette.length];

          return (
            <button
              key={subject.id}
              onClick={() => toggleSubject(subject)}
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
              <div className="mb-5 flex min-w-0 justify-end sm:mb-6">
                <div
                  className="max-w-full rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm sm:px-4"
                  style={{
                    backgroundColor: palette.pillSurface,
                    color: palette.accent,
                  }}
                >
                  {subject.topicCount} Topics
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
                        {subject.title}
                      </h3>
                    </div>
                    <p className="max-w-[30rem] break-words text-[14px] leading-7 sm:text-[15px] sm:leading-8" style={{ color: palette.muted }}>
                      {subject.topicCount} focused topics available in this subject path.
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3">
                    <span className="pr-2 text-xs font-medium leading-5 text-slate-600">
                      {isSelected ? 'Included in current blueprint' : 'Available for multi-select'}
                    </span>
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{
                        backgroundColor: isSelected ? `${brandConfig.primaryColor}18` : '#FFFFFF',
                        color: isSelected ? brandConfig.primaryColorDark : palette.accent,
                      }}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brandConfig.primaryColorDark }} />}
                      {isSelected ? 'Selected' : `${subject.topicCount} Topics`}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
