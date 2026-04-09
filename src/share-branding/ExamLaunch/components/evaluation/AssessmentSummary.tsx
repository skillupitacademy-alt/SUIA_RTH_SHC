import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Award, BookOpen, Target, Clock, Zap, Check } from 'lucide-react';


interface AssessmentSummaryProps {
  config: any;
  currentStep: number;
}

export function AssessmentSummary({ config, currentStep }: AssessmentSummaryProps) {
  const brandConfig = useBrand();

  const calculatePoints = () => {
    const basePoints = config.questionCount * 10;
    const difficultyMultiplier = config.difficulty === 'Expert' ? 1.5 : config.difficulty === 'Mixed' ? 1.2 : 1.0;
    return Math.round(basePoints * difficultyMultiplier);
  };

  const isComplete = currentStep === 5;

  return (
    <div className="relative z-10 hidden w-full max-w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-[-10px_0_40px_rgba(0,0,0,0.03)] transition-all duration-300 lg:block">
      <div className="sticky top-0 min-w-0">
        <h3 className="mb-4 break-words text-lg font-bold text-slate-900">Assessment Summary</h3>

        {/* Configuration Manifest */}
        <div className="space-y-4 mb-6">
          {/* Domain */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-slate-600">Domain</span>
            </div>
            {config.domain ? (
              <div className="flex min-w-0 items-center gap-2 pl-6">
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                <span className="min-w-0 break-words text-sm text-slate-900">{config.domain.title}</span>
              </div>
            ) : (
              <p className="pl-6 text-sm text-slate-500 italic">Not selected</p>
            )}
          </div>

          {/* Subjects */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-slate-600">Subjects</span>
            </div>
            {config.subjects.length > 0 ? (
              <div className="pl-6 space-y-1">
                {config.subjects.map((subject: any) => (
                  <div key={subject.id} className="flex min-w-0 items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    <span className="min-w-0 break-words text-sm text-slate-900">{subject.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-6 text-sm text-slate-500 italic">Not selected</p>
            )}
          </div>

          {/* Topics */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-slate-600">Topics</span>
            </div>
            {config.topics.length > 0 ? (
              <div className="pl-6 space-y-1">
                {config.topics.map((topic: any) => (
                  <div key={topic.id} className="flex min-w-0 items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    <span className="min-w-0 break-words text-sm text-slate-900">{topic.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-6 text-sm text-slate-500 italic">Not selected</p>
            )}
          </div>

          {/* Subtopics */}
          {config.subtopics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-slate-600">Subtopics</span>
              </div>
              <div className="pl-6">
                <span className="text-sm text-slate-900">{config.subtopics.length} selected</span>
              </div>
            </div>
          )}
        </div>

        {/* Calibration Metadata */}
        {isComplete && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Configuration</h4>
            <div className="space-y-2">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 text-sm text-slate-600">Difficulty</span>
                <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">{config.difficulty}</span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 text-sm text-slate-600">Questions</span>
                <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">{config.questionCount}</span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 text-sm text-slate-600">Est. Time</span>
                <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900">
                  ~{config.questionCount * 1.5} min
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Point Projection */}
        {isComplete && (
          <div className="mb-6 overflow-hidden rounded-xl border-2 border-gray-100 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.10)]">
            <div className="flex items-center gap-2 mb-2">
              <Award
                className="w-5 h-5 text-[#d81b60]"
                style={{ color: brandConfig.primaryColor }}
              />
              <span className="text-sm font-medium text-slate-900">Points Projection</span>
            </div>
            <div
              className="text-3xl font-black text-[#d81b60]"
              style={{ color: brandConfig.primaryColor }}
            >
              {calculatePoints()}
            </div>
            <p className="text-xs text-slate-600 mt-1">Maximum mastery points</p>
          </div>
        )}

        {/* Launch CTA */}
        {isComplete && (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d81b60] py-4 text-center font-medium text-white shadow-xl transition-all hover:opacity-90"
            style={{ backgroundColor: brandConfig.primaryColor }}
          >
            <Zap className="h-5 w-5 shrink-0" />
            Launch Evaluation
          </button>
        )}

        {/* Progress Indicator */}
        {!isComplete && (
          <div className="mt-6 overflow-hidden rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Configuration Progress</span>
            </div>
            <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-2">Step {currentStep} of 5</p>
          </div>
        )}
      </div>
    </div>
  );
}
