import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Shuffle, Target, TrendingUp, Check } from 'lucide-react';
import { useLaunchData } from '../LaunchDataContext';

interface EngineCalibrationProps {
  difficulty: string;
  questionCount: number;
  onDifficultyChange: (difficulty: string) => void;
  onQuestionCountChange: (count: number) => void;
}

const iconMap = {
  shuffle: Shuffle,
  target: Target,
  trending: TrendingUp,
} as const;

export function EngineCalibration({
  difficulty,
  questionCount,
  onDifficultyChange,
  onQuestionCountChange,
}: EngineCalibrationProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col">
      <div className="mb-6 sm:mb-8">
        <h3 className="mb-4 break-words text-lg font-bold text-slate-900">{data.calibration.difficultyLabel}</h3>
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          {data.calibration.difficultyTiers.map((tier) => {
            const Icon = iconMap[tier.icon];
            const isSelected = difficulty === tier.id;

            return (
              <button
                key={tier.id}
                onClick={() => onDifficultyChange(tier.id)}
                className={`w-full min-w-0 overflow-hidden rounded-[1.75rem] border-2 p-5 text-left shadow-[0_20px_42px_rgba(15,23,42,0.14),0_8px_18px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_rgba(15,23,42,0.2),0_12px_24px_rgba(15,23,42,0.12)] sm:p-6 ${
                  isSelected ? '' : 'border border-gray-200 bg-white'
                }`}
                style={isSelected ? { borderColor: brandConfig.primaryColor, borderWidth: '2px', boxShadow: `inset 0 0 0 1px ${brandConfig.primaryColor}, 0 28px 60px rgba(15,23,42,0.22), 0 12px 24px rgba(15,23,42,0.12)` } : {}}
              >
                <div className="flex min-w-0 flex-col">
                  <div className={`mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-inner ${tier.iconBg}`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  <h4 className="mb-2 break-words text-lg font-bold text-slate-900">{tier.title}</h4>
                  <p className="break-words text-sm leading-6 text-slate-600">{tier.description}</p>

                  <div className="mt-5">
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                      <span className="pr-2 text-xs font-medium text-slate-600">
                        {isSelected ? 'Current difficulty selection' : 'Tap to use this difficulty'}
                      </span>
                      <span
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{
                          backgroundColor: isSelected ? `${brandConfig.primaryColor}18` : '#FFFFFF',
                          color: isSelected ? brandConfig.primaryColorDark : '#475569',
                        }}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                        {isSelected ? 'Selected' : tier.title}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-4 break-words text-lg font-bold text-slate-900">{data.calibration.questionCountLabel}</h3>
        <div className="grid w-full min-w-0 grid-cols-2 gap-4 md:grid-cols-4">
          {data.calibration.questionCounts.map((count) => {
            const isSelected = questionCount === count;
            const estimatedTime = count * 1.5;

            return (
              <button
                key={count}
                onClick={() => onQuestionCountChange(count)}
                className={`w-full min-w-0 overflow-hidden rounded-[1.5rem] border-2 p-4 shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.14)] sm:p-6 ${
                  isSelected ? '' : 'border-gray-200 bg-white'
                }`}
                style={isSelected ? { borderColor: brandConfig.primaryColor, backgroundColor: `${brandConfig.primaryColor}0D`, boxShadow: `inset 0 0 0 1px ${brandConfig.primaryColor}, 0 20px 45px rgba(15,23,42,0.14)` } : {}}
              >
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold sm:text-4xl" style={isSelected ? { color: brandConfig.primaryColor } : {}}>
                    {count}
                  </div>
                  <p className="text-sm text-slate-600">{data.calibration.previewQuestionsLabel}</p>
                  <p className="mt-2 text-xs text-slate-500">~{estimatedTime} {data.labels.minutesSuffix}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-white/80 px-3 py-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: isSelected ? `${brandConfig.primaryColor}18` : '#FFFFFF',
                      color: isSelected ? brandConfig.primaryColorDark : '#475569',
                    }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {isSelected ? 'Selected' : `${count} Questions`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 w-full min-w-0 overflow-hidden rounded-[1.75rem] border-2 border-gray-200 bg-white p-5 shadow-[0_20px_42px_rgba(15,23,42,0.14),0_8px_18px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_70px_rgba(15,23,42,0.18),0_12px_24px_rgba(15,23,42,0.12)] sm:mt-8 sm:p-6">
        <h4 className="mb-3 break-words font-bold text-slate-900">{data.calibration.previewTitle}</h4>
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="mb-1 text-sm text-slate-600">{data.calibration.previewDifficultyLabel}</p>
            <p className="font-bold text-slate-900">{difficulty} {data.labels.difficultyModeSuffix}</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-slate-600">{data.calibration.previewQuestionsLabel}</p>
            <p className="font-bold text-slate-900">{questionCount} {data.labels.questionsSuffix}</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-slate-600">{data.calibration.previewTimeLabel}</p>
            <p className="font-bold text-slate-900">~{questionCount * 1.5} {data.labels.minutesSuffix}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
