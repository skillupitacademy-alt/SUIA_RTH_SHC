import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, AlertCircle, Clock, Award, Zap, ArrowLeft } from 'lucide-react';
import { DomainSelection } from './evaluation/DomainSelection';
import { SubjectSelection } from './evaluation/SubjectSelection';
import { TopicSelection } from './evaluation/TopicSelection';
import { SubtopicSelection } from './evaluation/SubtopicSelection';
import { EngineCalibration } from './evaluation/EngineCalibration';
import { AssessmentSummary } from './evaluation/AssessmentSummary';


export function LaunchEvaluation() {
  const brandConfig = useBrand();

  const [currentStep, setCurrentStep] = useState(1);
  const [expertMode, setExpertMode] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showActiveSession, setShowActiveSession] = useState(true);

  const [config, setConfig] = useState({
    domain: null as any,
    subjects: [] as any[],
    topics: [] as any[],
    subtopics: [] as any[],
    difficulty: 'Mixed' as string,
    questionCount: 20,
  });

  const steps = [
    { number: 1, title: 'Knowledge Mapping', subtitle: 'Select Domain' },
    { number: 2, title: 'Knowledge Mapping', subtitle: 'Select Subjects' },
    { number: 3, title: 'Knowledge Mapping', subtitle: 'Select Topics' },
    { number: 4, title: 'Knowledge Mapping', subtitle: 'Select Subtopics' },
    { number: 5, title: 'Engine Calibration', subtitle: 'Configure Assessment' },
  ];

  const getBreadcrumb = () => {
    const parts = [];
    if (config.domain) parts.push(config.domain.title);
    if (config.subjects.length > 0) parts.push(config.subjects[0].title);
    if (config.topics.length > 0) parts.push(config.topics[0].title);
    return parts.join(' / ') || 'Start Configuration';
  };

  const canAdvance = () => {
    if (currentStep === 1) return config.domain !== null;
    if (currentStep === 2) return config.subjects.length > 0;
    if (currentStep === 3) return config.topics.length > 0;
    if (currentStep === 4) return config.subtopics.length > 0;
    return true;
  };

  const handleAdvance = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Active Session Banner */}
      {showActiveSession && (
        <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" />
            <div>
              <p className="font-medium">Active Session In Progress</p>
              <p className="text-sm text-white/90">You have an ongoing exam: "Algebra Fundamentals"</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
              Resume Exam
            </button>
            <button
              onClick={() => setShowActiveSession(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* HUD Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{brandConfig.name}</h1>
              <p className="text-sm text-slate-400 font-semibold mt-1">
                {getBreadcrumb().split(' / ').map((part, index, arr) => (
                  <span key={index}>
                    <span
                      className={index === arr.length - 1 ? 'text-[#d81b60]' : ''}
                      style={index === arr.length - 1 ? { color: brandConfig.primaryColor } : {}}
                    >
                      {part}
                    </span>
                    {index < arr.length - 1 && ' / '}
                  </span>
                ))}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Basic</span>
                <button
                  onClick={() => setExpertMode(!expertMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    expertMode ? 'bg-[#d81b60]' : 'bg-gray-200'
                  }`}
                  style={expertMode ? { backgroundColor: brandConfig.primaryColor } : {}}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      expertMode ? 'transform translate-x-6' : ''
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600">Expert</span>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep === step.number
                        ? 'bg-[#d81b60] text-white'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                    style={
                      currentStep === step.number
                        ? { backgroundColor: brandConfig.primaryColor }
                        : {}
                    }
                  >
                    {step.number}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.subtitle}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-px bg-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Split Pillar Architecture */}
      <div className="flex-1 flex">
        {/* Left Column (65%) - Configuration Frame */}
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            {/* h-530 Frame - Strict height, no scrolling */}
            <div className="h-[530px] overflow-hidden">
              {currentStep === 1 && (
                <DomainSelection
                  selected={config.domain}
                  onSelect={(domain) => setConfig({ ...config, domain })}
                />
              )}
              {currentStep === 2 && (
                <SubjectSelection
                  domain={config.domain}
                  selected={config.subjects}
                  onSelect={(subjects) => setConfig({ ...config, subjects })}
                />
              )}
              {currentStep === 3 && (
                <TopicSelection
                  selected={config.topics}
                  onSelect={(topics) => setConfig({ ...config, topics })}
                  subjects={config.subjects}
                  maxSelections={4}
                />
              )}
              {currentStep === 4 && (
                <SubtopicSelection
                  topics={config.topics}
                  selected={config.subtopics}
                  onSelect={(subtopics) => setConfig({ ...config, subtopics })}
                />
              )}
              {currentStep === 5 && (
                <EngineCalibration
                  difficulty={config.difficulty}
                  questionCount={config.questionCount}
                  onDifficultyChange={(difficulty) => setConfig({ ...config, difficulty })}
                  onQuestionCountChange={(questionCount) => setConfig({ ...config, questionCount })}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column (35%) - Assessment Summary Pillar */}
        <AssessmentSummary config={config} currentStep={currentStep} />
      </div>

      {/* Navigation Footer - Bottom Anchored */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="text-sm text-gray-600 font-medium">
            Step {currentStep} of {steps.length}
          </div>

          <button
            onClick={handleAdvance}
            disabled={!canAdvance()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#d81b60] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
            style={{ backgroundColor: brandConfig.primaryColor }}
          >
            {currentStep === 5 ? 'Launch Exam' : 'Continue'}
            {currentStep < 5 && <ChevronRight className="w-5 h-5" />}
            {currentStep === 5 && <Zap className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Exit Guard Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Unsaved Configuration</h3>
                <p className="text-sm text-gray-600">Your progress will be lost</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to exit? Your current configuration will not be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Continue Editing
              </button>
              <button
                className="flex-1 px-4 py-2.5 bg-[#d81b60] text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-lg"
                style={{ backgroundColor: brandConfig.primaryColor }}
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}