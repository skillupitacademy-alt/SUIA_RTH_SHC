import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { useRouter } from 'next/navigation';
import { Award, BookOpen, Target, Clock, Zap, Check } from 'lucide-react';
import { useLaunchData } from '../LaunchDataContext';

interface AssessmentSummaryProps {
  config: any;
  currentStep: number;
}

export function AssessmentSummary({ config, currentStep }: AssessmentSummaryProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();
  const router = useRouter();

  const calculatePoints = () => {
    const basePoints = config.questionCount * 10;
    const difficultyMultiplier = config.difficulty === 'Expert' ? 1.5 : config.difficulty === 'Mixed' ? 1.2 : 1.0;
    return Math.round(basePoints * difficultyMultiplier);
  };

  const isComplete = currentStep === data.steps.length;

  return (
    <div className="relative z-10 hidden w-full max-w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-[-10px_0_40px_rgba(0,0,0,0.03)] transition-all duration-300 lg:block">
      <div className="sticky top-0 min-w-0">
        <h3 className="mb-4 break-words text-lg font-bold text-slate-900">{data.summary.title}</h3>

        <div className="mb-6 space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-slate-600">{data.summary.domainLabel}</span>
            </div>
            {config.domain ? (
              <div className="flex min-w-0 items-center gap-2 pl-6">
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                <span className="min-w-0 break-words text-sm text-slate-900">{config.domain.title}</span>
              </div>
            ) : (
              <p className="pl-6 text-sm italic text-slate-500">{data.summary.notSelectedLabel}</p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-slate-600">{data.summary.subjectsLabel}</span>
            </div>
            {config.subjects.length > 0 ? (
              <div className="space-y-1 pl-6">
                {config.subjects.map((subject: any) => (
                  <div key={subject.id} className="flex min-w-0 items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    <span className="min-w-0 break-words text-sm text-slate-900">{subject.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-6 text-sm italic text-slate-500">{data.summary.notSelectedLabel}</p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-slate-600">{data.summary.topicsLabel}</span>
            </div>
            {config.topics.length > 0 ? (
              <div className="space-y-1 pl-6">
                {config.topics.map((topic: any) => (
                  <div key={topic.id} className="flex min-w-0 items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    <span className="min-w-0 break-words text-sm text-slate-900">{topic.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-6 text-sm italic text-slate-500">{data.summary.notSelectedLabel}</p>
            )}
          </div>

          {config.subtopics.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-slate-600">{data.summary.subtopicsLabel}</span>
              </div>
              <div className="pl-6">
                <span className="text-sm text-slate-900">{config.subtopics.length} selected</span>
              </div>
            </div>
          )}
        </div>

        {isComplete && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-bold text-slate-900">{data.summary.configurationTitle}</h4>
            <div className="space-y-2">
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
          <div className="mb-6 overflow-hidden rounded-xl border-2 border-gray-100 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.10)]">
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

        {isComplete && (
          <button onClick={() => router.push('/exam')} className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-center font-medium text-white shadow-xl transition-all hover:opacity-90" style={{ backgroundColor: brandConfig.primaryColor }}>
            <Zap className="h-5 w-5 shrink-0" />
            {data.labels.launchLabel}
          </button>
        )}

        {!isComplete && (
          <div className="mt-6 overflow-hidden rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{data.summary.progressTitle}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(currentStep / data.steps.length) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-blue-700">Step {currentStep} of {data.steps.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}
