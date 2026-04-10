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
    <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto">
      <div className="mb-8 min-w-0">
        <h2 className="mb-2 break-words text-2xl font-bold text-slate-800">{data.calibration.title}</h2>
        <p className="break-words text-slate-600">{data.calibration.description}</p>
      </div>

      <div className="mb-8">
        <h3 className="mb-4 break-words text-lg font-bold text-slate-900">{data.calibration.difficultyLabel}</h3>
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          {data.calibration.difficultyTiers.map((tier) => {
            const Icon = iconMap[tier.icon];
            const isSelected = difficulty === tier.id;

            return (
              <button
                key={tier.id}
                onClick={() => onDifficultyChange(tier.id)}
                className={`relative w-full min-w-0 overflow-hidden rounded-2xl border p-6 text-left shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] ${
                  isSelected ? '' : 'border border-gray-200 bg-white'
                }`}
                style={isSelected ? { borderColor: brandConfig.primaryColor, borderWidth: '2px' } : {}}
              >
                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: brandConfig.primaryColor }}>
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className={`mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tier.iconBg}`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                <h4 className="mb-2 break-words text-lg font-bold text-slate-900">{tier.title}</h4>
                <p className="break-words text-sm text-slate-600">{tier.description}</p>
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
                className={`w-full min-w-0 overflow-hidden rounded-xl border-2 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.10)] sm:p-6 ${
                  isSelected ? '' : 'border-gray-200 bg-white'
                }`}
                style={isSelected ? { borderColor: brandConfig.primaryColor, backgroundColor: `${brandConfig.primaryColor}0D` } : {}}
              >
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold sm:text-4xl" style={isSelected ? { color: brandConfig.primaryColor } : {}}>
                    {count}
                  </div>
                  <p className="text-sm text-slate-600">{data.calibration.previewQuestionsLabel}</p>
                  <p className="mt-2 text-xs text-slate-500">~{estimatedTime} min</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 w-full min-w-0 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]">
        <h4 className="mb-3 break-words font-bold text-slate-900">{data.calibration.previewTitle}</h4>
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="mb-1 text-sm text-slate-600">{data.calibration.previewDifficultyLabel}</p>
            <p className="font-bold text-slate-900">{difficulty} Mode</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-slate-600">{data.calibration.previewQuestionsLabel}</p>
            <p className="font-bold text-slate-900">{questionCount} Questions</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-slate-600">{data.calibration.previewTimeLabel}</p>
            <p className="font-bold text-slate-900">~{questionCount * 1.5} minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
