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
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Configure Your Assessment</h2>
        <p className="text-slate-600">Customize difficulty level and question count</p>
      </div>

      {/* Difficulty Tier Selector - Bento Style Cards */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Difficulty Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficultyTiers.map((tier) => {
            const Icon = tier.icon;
            const isSelected = difficulty === tier.id;

            return (
              <button
                key={tier.id}
                onClick={() => onDifficultyChange(tier.id)}
                className={`p-6 rounded-2xl border transition-all text-left hover:shadow-lg relative ${
                  isSelected
                    ? 'border-2 shadow-sm'
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

                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${tier.iconBg}`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h4 className="font-bold text-lg text-slate-900 mb-2">{tier.title}</h4>
                <p className="text-sm text-slate-600">{tier.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Count Selector - Density Dials */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Number of Questions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {questionCounts.map((count) => {
            const isSelected = questionCount === count;
            const estimatedTime = count * 1.5; // 1.5 minutes per question

            return (
              <button
                key={count}
                onClick={() => onQuestionCountChange(count)}
                className={`p-6 rounded-xl border-2 transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-[#d81b60] bg-[#d81b60]/5 shadow-sm'
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
                    className={`text-4xl font-bold mb-2 ${
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
      <div className="mt-8 p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
        <h4 className="font-bold text-slate-900 mb-3">Assessment Preview</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
