import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Award, BookOpen, Target, Clock, Check } from 'lucide-react';
import { useLaunchData } from '../LaunchDataContext';
import { LaunchSelectionState } from '../../../launchExamPageData';

interface AssessmentSummaryProps {
  config: LaunchSelectionState;
  currentStep: number;
}

export function AssessmentSummary({ config, currentStep }: AssessmentSummaryProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();

  const calculatePoints = () => {
    const basePoints = config.questionCount * 10;
    const difficultyMultiplier = config.difficulty === 'Expert' ? 1.5 : config.difficulty === 'Mixed' ? 1.2 : 1.0;
    return Math.round(basePoints * difficultyMultiplier);
  };

  const isComplete = currentStep === data.steps.length;
  const progressPercent = (currentStep / data.steps.length) * 100;
  const summaryItems = [
    {
      icon: BookOpen,
      label: data.summary.domainLabel,
      empty: data.summary.emptyDomainLabel,
      value: config.domain ? config.domain.title : null,
    },
    {
      icon: Target,
      label: data.summary.subjectsLabel,
      empty: data.summary.emptySubjectsLabel,
      value: config.subjects.length > 0 ? data.labels.selectedCountFormat.replace('{count}', String(config.subjects.length)) : null,
      detail: config.subjects.length > 0 ? config.subjects.slice(0, 2).map((subject) => subject.title).join(', ') : null,
    },
    {
      icon: Award,
      label: data.summary.topicsLabel,
      empty: data.summary.emptyTopicsLabel,
      value: config.topics.length > 0 ? data.labels.selectedCountFormat.replace('{count}', String(config.topics.length)) : null,
      detail: config.topics.length > 0 ? config.topics.slice(0, 2).map((topic) => topic.title).join(', ') : null,
    },
    {
      icon: Check,
      label: data.summary.subtopicsLabel,
      empty: data.summary.emptySubtopicsLabel,
      value: config.subtopics.length > 0 ? data.labels.selectedCountFormat.replace('{count}', String(config.subtopics.length)) : null,
    },
  ];

  return (
    <div className="relative z-10 w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_56px_rgba(15,23,42,0.08)] transition-all duration-300">
      <div className="min-w-0">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: brandConfig.primaryColor }}>
            {data.labels.decisionRailLabel}
          </p>
          <h3 className="mt-2 break-words text-[clamp(1.4rem,1.3vw_+_1rem,2rem)] font-black tracking-tight text-slate-900">{data.summary.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{data.summary.description}</p>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">{data.summary.progressTitle}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-200">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-blue-900">Step {currentStep} of {data.steps.length}</span>
                <span className="text-blue-700">{Math.round(progressPercent)}% ready</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {summaryItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                    </div>
                    {item.value ? (
                      <>
                        <p className="text-sm font-bold text-slate-900">{item.value}</p>
                        {item.detail && <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>}
                      </>
                    ) : (
                      <p className="text-sm italic text-slate-500">{item.empty}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <h4 className="text-sm font-bold text-slate-900">{data.labels.assessmentProjectionLabel}</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-xl bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{data.labels.estimatedDurationLabel}</p>
                  <p className="mt-2 text-base font-bold text-slate-900">~{config.questionCount * 1.5} {data.labels.minutesSuffix}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{data.labels.questionScopeLabel}</p>
                  <p className="mt-2 text-base font-bold text-slate-900">{config.questionCount} {data.labels.questionsSuffix}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{data.calibration.previewDifficultyLabel}</p>
                  <p className="mt-2 text-base font-bold text-slate-900">{config.difficulty}</p>
                </div>
              </div>
            </div>

            {isComplete && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-bold text-slate-900">{data.summary.configurationTitle}</h4>
                <div className="space-y-2.5">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 text-sm text-slate-600">{data.calibration.previewDifficultyLabel}</span>
                    <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">{config.difficulty}</span>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 text-sm text-slate-600">{data.calibration.previewQuestionsLabel}</span>
                    <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">{config.questionCount}</span>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 text-sm text-slate-600">{data.calibration.previewTimeLabel}</span>
                    <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">~{config.questionCount * 1.5} min</span>
                  </div>
                </div>
              </div>
            )}

            {isComplete && (
              <div className="overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.10)]">
                <div className="mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5" style={{ color: brandConfig.primaryColor }} />
                  <span className="text-sm font-medium text-slate-900">{data.summary.pointsProjectionTitle}</span>
                </div>
                <div className="text-3xl font-black" style={{ color: brandConfig.primaryColor }}>
                  {calculatePoints()}
                </div>
                <p className="mt-1 text-xs text-slate-600">{data.summary.pointsProjectionSubtitle}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
