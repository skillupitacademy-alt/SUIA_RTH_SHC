import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, AlertCircle, Clock, Zap, ArrowLeft } from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
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
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-slate-50">
      <header role="banner" className="flex-none">
        {showActiveSession && (
          <div className="flex flex-col items-center justify-between gap-3 bg-orange-700 px-4 py-2.5 text-center text-white transition-colors duration-300 sm:flex-row sm:py-3 sm:text-left">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold sm:text-base sm:font-medium">Active Session In Progress</p>
                <p className="text-[10px] text-white sm:text-sm">"Algebra Fundamentals" is currently active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Resume active session"
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-orange-800 shadow-md transition-colors hover:bg-gray-100 hover:shadow-lg sm:px-4 sm:py-2 sm:text-sm"
              >
                Resume
              </button>
              <button
                onClick={() => setShowActiveSession(false)}
                aria-label="Dismiss banner"
                className="rounded-full p-1 transition-all hover:scale-110 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-full">
                <h1 className="text-2xl font-bold text-slate-800">{brandConfig.name}</h1>
                <p className="mt-1 break-words text-sm font-semibold text-slate-500">
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

              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 sm:gap-4">
                <Link
                  href="/dashboard"
                  aria-label="Return to dashboard"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden xs:block">Dashboard</span>
                </Link>
                <div className="ml-auto flex items-center gap-2 sm:ml-0">
                  <span className="text-[10px] text-gray-600 sm:text-sm">Basic</span>
                  <button
                    aria-label="Toggle Expert Mode"
                    onClick={() => setExpertMode(!expertMode)}
                    className={`relative h-5 w-10 rounded-full transition-colors sm:h-6 sm:w-12 ${
                      expertMode ? 'bg-[#d81b60]' : 'bg-gray-200'
                    }`}
                    style={expertMode ? { backgroundColor: brandConfig.primaryColor } : {}}
                  >
                    <div
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform sm:left-1 sm:top-1 ${
                        expertMode ? 'translate-x-5 sm:translate-x-6' : ''
                      }`}
                    />
                  </button>
                  <span className="text-[10px] text-gray-600 sm:text-sm">Expert</span>
                </div>
              </div>
            </div>

            <div 
              className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              tabIndex={0}
              role="region"
              aria-label="Assessment Steps Navigation"
            >
              <div className="flex min-w-max items-center gap-1.5 sm:gap-2">
                {steps.map((step, index) => {
                  const isActive = currentStep === step.number;
                  const isPast = currentStep > step.number;

                  return (
                    <div key={step.number} className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all duration-300 sm:h-8 sm:w-8 sm:text-sm ${
                            isActive
                              ? 'bg-[#d81b60] text-white shadow-lg'
                              : isPast
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                          style={isActive ? { backgroundColor: brandConfig.primaryColor } : {}}
                          title={step.subtitle}
                        >
                          {step.number}
                        </div>
                        <div className="hidden min-[860px]:block">
                          <p className="whitespace-nowrap text-sm font-bold text-gray-900">{step.title}</p>
                          <p className="whitespace-nowrap text-xs font-semibold text-gray-500">{step.subtitle}</p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`mx-1 h-1 w-4 rounded-full transition-colors duration-300 sm:mx-2 sm:w-8 md:w-12 ${isPast ? 'bg-green-600/30' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden" role="main">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="min-w-0 flex-1 p-4 pb-28 sm:p-6 sm:pb-24 lg:pb-6">
            <div className="mx-auto w-full max-w-5xl min-w-0">
              <div className="w-full min-w-0 lg:h-[530px] lg:overflow-hidden lg:pb-0">
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

          <div className="hidden shrink-0 lg:block">
            <AssessmentSummary config={config} currentStep={currentStep} />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 w-full max-w-full overflow-x-hidden border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:px-6 lg:relative lg:shadow-sm">
          <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              aria-label="Go to previous step"
              className="flex min-w-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:text-sm"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            <div className="order-3 w-full text-center text-xs font-medium text-gray-600 sm:order-none sm:w-auto sm:text-sm">
              Step {currentStep} of {steps.length}
            </div>

            <button
              onClick={handleAdvance}
              disabled={!canAdvance()}
              aria-label={currentStep === 5 ? 'Launch Evaluation' : 'Continue to next step'}
              className="flex min-w-0 items-center gap-2 rounded-lg bg-[#d81b60] px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:text-sm"
              style={{ backgroundColor: brandConfig.primaryColor }}
            >
              {currentStep === 5 ? 'Launch Evaluation' : 'Continue'}
              {currentStep < 5 && <ChevronRight className="h-5 w-5" />}
              {currentStep === 5 && <Zap className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </main>

      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Unsaved Configuration</h3>
                <p className="text-sm text-gray-600">Your progress will be lost</p>
              </div>
            </div>
            <p className="mb-6 text-gray-700">
              Are you sure you want to exit? Your current configuration will not be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Continue Editing
              </button>
              <button
                aria-label="Confirm exit and discard progress"
                className="flex-1 rounded-lg bg-[#d81b60] px-4 py-2.5 font-medium text-white shadow-lg transition-all hover:opacity-90"
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
