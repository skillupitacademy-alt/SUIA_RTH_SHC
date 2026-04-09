import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Shuffle, Target, TrendingUp, Check } from 'lucide-react';


interface EngineCalibrationProps {
  difficulty: string;
  questionCount: number;
  onDifficultyChange: (difficulty: string) => void;
  onQuestionCountChange: (count: number) => void;
}

const difficultyTiers = [
  {
    id: 'Mixed',
    title: 'Mixed Mode',
    description: 'Balanced mix of easy, medium, and hard questions',
    icon: Shuffle,
    iconBg: 'bg-blue-500',
  },
  {
    id: 'Simple',
    title: 'Fundamentals',
    description: 'Focus on core concepts and basic applications',
    icon: Target,
    iconBg: 'bg-green-500',
  },
  {
    id: 'Expert',
    title: 'Advanced',
    description: 'Challenging problems requiring deep understanding',
    icon: TrendingUp,
    iconBg: 'bg-purple-600',
  },
];

const questionCounts = [10, 20, 30, 40];

export function EngineCalibration({
  difficulty,
  questionCount,
  onDifficultyChange,
  onQuestionCountChange,
}: EngineCalibrationProps) {
  const brandConfig = useBrand();

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto">
      <div className="mb-8 min-w-0">
        <h2 className="mb-2 break-words text-2xl font-bold text-slate-800">Configure Your Assessment</h2>
        <p className="break-words text-slate-600">Customize difficulty level and question count</p>
      </div>

      {/* Difficulty Tier Selector - Bento Style Cards */}
      <div className="mb-8">
        <h3 className="mb-4 break-words text-lg font-bold text-slate-900">Difficulty Level</h3>
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          {difficultyTiers.map((tier) => {
            const Icon = tier.icon;
            const isSelected = difficulty === tier.id;

            return (
              <button
                key={tier.id}
                onClick={() => onDifficultyChange(tier.id)}
                className={`relative w-full min-w-0 overflow-hidden rounded-2xl border p-6 text-left transition-all shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] ${
                  isSelected
                    ? 'border-2'
                    : 'border border-gray-200 bg-white'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: brandConfig.primaryColor,
                        borderWidth: '2px',
                      }
                    : {}
                }
              >
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#d81b60] flex items-center justify-center"
                    style={{ backgroundColor: brandConfig.primaryColor }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tier.iconBg}`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h4 className="mb-2 break-words text-lg font-bold text-slate-900">{tier.title}</h4>
                <p className="break-words text-sm text-slate-600">{tier.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Count Selector - Density Dials */}
      <div>
        <h3 className="mb-4 break-words text-lg font-bold text-slate-900">Number of Questions</h3>
        <div className="grid w-full min-w-0 grid-cols-2 gap-4 md:grid-cols-4">
          {questionCounts.map((count) => {
            const isSelected = questionCount === count;
            const estimatedTime = count * 1.5; // 1.5 minutes per question

            return (
              <button
                key={count}
                onClick={() => onQuestionCountChange(count)}
                className={`w-full min-w-0 overflow-hidden rounded-xl border-2 p-4 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.10)] sm:p-6 ${
                  isSelected
                    ? 'border-[#d81b60] bg-[#d81b60]/5'
                    : 'border-gray-200 bg-white'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: brandConfig.primaryColor,
                        backgroundColor: `${brandConfig.primaryColor}0D`, // 5% opacity
                      }
                    : {}
                }
              >
                <div className="text-center">
                  <div
                    className={`mb-2 text-3xl font-bold sm:text-4xl ${
                      isSelected ? 'text-[#d81b60]' : 'text-slate-900'
                    }`}
                    style={isSelected ? { color: brandConfig.primaryColor } : {}}
                  >
                    {count}
                  </div>
                  <p className="text-sm text-slate-600">Questions</p>
                  <p className="text-xs text-slate-500 mt-2">~{estimatedTime} min</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="mt-8 w-full min-w-0 overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]">
        <h4 className="mb-3 break-words font-bold text-slate-900">Assessment Preview</h4>
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-600 mb-1">Difficulty</p>
            <p className="font-bold text-slate-900">{difficulty} Mode</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Questions</p>
            <p className="font-bold text-slate-900">{questionCount} Questions</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Est. Time</p>
            <p className="font-bold text-slate-900">~{questionCount * 1.5} minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
