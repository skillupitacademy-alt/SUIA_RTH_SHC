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
    <div className="w-80 bg-white border-l border-gray-200 p-6 hidden lg:block overflow-y-auto shadow-lg">
      <div className="sticky top-0">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Assessment Summary</h3>

        {/* Configuration Manifest */}
        <div className="space-y-4 mb-6">
          {/* Domain */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-slate-600">Domain</span>
            </div>
            {config.domain ? (
              <div className="pl-6 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-slate-900">{config.domain.title}</span>
              </div>
            ) : (
              <p className="pl-6 text-sm text-slate-400 italic">Not selected</p>
            )}
          </div>

          {/* Subjects */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-slate-600">Subjects</span>
            </div>
            {config.subjects.length > 0 ? (
              <div className="pl-6 space-y-1">
                {config.subjects.map((subject: any) => (
                  <div key={subject.id} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-slate-900">{subject.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-6 text-sm text-slate-400 italic">Not selected</p>
            )}
          </div>

          {/* Topics */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-slate-600">Topics</span>
            </div>
            {config.topics.length > 0 ? (
              <div className="pl-6 space-y-1">
                {config.topics.map((topic: any) => (
                  <div key={topic.id} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-slate-900">{topic.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-6 text-sm text-slate-400 italic">Not selected</p>
            )}
          </div>

          {/* Subtopics */}
          {config.subtopics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-gray-400" />
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
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Configuration</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Difficulty</span>
                <span className="text-sm font-medium text-slate-900">{config.difficulty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Questions</span>
                <span className="text-sm font-medium text-slate-900">{config.questionCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Est. Time</span>
                <span className="text-sm font-medium text-slate-900">
                  ~{config.questionCount * 1.5} min
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Point Projection */}
        {isComplete && (
          <div className="mb-6 p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
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
            className="w-full py-4 bg-[#d81b60] text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 font-medium shadow-xl"
            style={{ backgroundColor: brandConfig.primaryColor }}
          >
            <Zap className="w-5 h-5" />
            Launch Evaluation
          </button>
        )}

        {/* Progress Indicator */}
        {!isComplete && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
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
