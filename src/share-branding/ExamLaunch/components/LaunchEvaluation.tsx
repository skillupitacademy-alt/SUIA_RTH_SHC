import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient, QuestionCounts } from '@quiz/api-client';
import { ChevronLeft, ChevronRight, X, AlertCircle, Clock, Zap, ArrowLeft } from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { DomainSelection } from './evaluation/DomainSelection';
import { SubjectSelection } from './evaluation/SubjectSelection';
import { TopicSelection } from './evaluation/TopicSelection';
import { SubtopicSelection } from './evaluation/SubtopicSelection';
import { EngineCalibration } from './evaluation/EngineCalibration';
import { AssessmentSummary } from './evaluation/AssessmentSummary';
import { useLaunchData } from './LaunchDataContext';
import { LaunchSelectionState } from '../../launchExamPageData';

export function LaunchEvaluation() {
  const brandConfig = useBrand();
  const data = useLaunchData();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [expertMode, setExpertMode] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showActiveSession, setShowActiveSession] = useState(false);
  const [activeSession, setActiveSession] = useState<{ examId: string; title: string } | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [questionAvailability, setQuestionAvailability] = useState<QuestionCounts | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [config, setConfig] = useState<LaunchSelectionState>({
    domain: null,
    subjects: [],
    topics: [],
    subtopics: [],
    difficulty: 'Mixed',
    questionCount: 20,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadActiveSession() {
      try {
        const response = await fetch('/api/quiz/active', {
          credentials: 'include',
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as {
          data?: { active?: boolean; examId?: string; title?: string };
          active?: boolean;
          examId?: string;
          title?: string;
        } | null;
        const active = payload?.data ?? payload;

        if (
          cancelled === false &&
          active?.active === true &&
          typeof active.examId === 'string' &&
          active.examId.length > 0
        ) {
          setActiveSession({
            examId: active.examId,
            title: active.title ?? 'Active exam',
          });
          setShowActiveSession(true);
        }
      } catch {
        if (cancelled === false) {
          setActiveSession(null);
          setShowActiveSession(false);
        }
      }
    }

    void loadActiveSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestionAvailability() {
      if (config.domain === null) {
        setQuestionAvailability(null);
        return;
      }

      setAvailabilityLoading(true);
      try {
        const counts = await apiClient.quiz.getQuestionCount({
          domainId: config.domain.id,
          subjectIds: config.subjects.length > 0 ? config.subjects.map((subject) => subject.id) : undefined,
          topicIds: config.topics.length > 0 ? config.topics.map((topic) => topic.id) : undefined,
          subtopicIds: config.subtopics.length > 0 ? config.subtopics.map((subtopic) => subtopic.id) : undefined,
        });

        if (!cancelled) {
          setQuestionAvailability(counts);
        }
      } catch {
        if (!cancelled) {
          setQuestionAvailability(null);
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    }

    void loadQuestionAvailability();

    return () => {
      cancelled = true;
    };
  }, [config.domain, config.subjects, config.topics, config.subtopics]);

  const canAdvance = () => {
    if (currentStep === 1) return config.domain !== null;
    if (currentStep === 2) return config.subjects.length > 0;
    if (currentStep === 3) return config.topics.length > 0;
    if (currentStep === 4) return config.subtopics.length > 0;
    return true;
  };

  const handleAdvance = async () => {
    if (currentStep < data.steps.length) {
      setCurrentStep(currentStep + 1);
      setLaunchError(null);
    } else {
      setIsLaunching(true);
      setLaunchError(null);

      try {
        if (questionAvailability !== null && questionAvailability.total === 0) {
          throw new Error('No active questions found for this selected domain, subject, topic, and subtopic.');
        }

        if (questionAvailability !== null && questionAvailability.total < config.questionCount) {
          throw new Error(`Only ${questionAvailability.total} active questions are available for this selection. Reduce the question count or upload more SHC questions.`);
        }

        const payload = await apiClient.quiz.startExam(
          {
            domainId: config.domain?.id,
            subjectIds: config.subjects.map((subject) => subject.id),
            topicIds: config.topics.map((topic) => topic.id),
            subtopicIds: config.subtopics.map((subtopic) => subtopic.id),
            difficulty: config.difficulty.toLowerCase(),
            questionCount: config.questionCount,
          },
          { idempotencyKey: crypto.randomUUID() }
        );

        if (payload.examId == null || payload.examId === '') {
          throw new Error('Unable to start exam.');
        }

        router.push(`/exam?examId=${encodeURIComponent(payload.examId)}`);
      } catch (error) {
        setLaunchError(error instanceof Error ? error.message : 'Unable to start exam.');
      } finally {
        setIsLaunching(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepConfig = data.steps[currentStep - 1];
  const showFinalSummary = currentStep === data.steps.length;
  const stepHeading =
    currentStep === 1
      ? data.domainSelection.title
      : currentStep === 2
        ? 'Select Your Subjects'
        : currentStep === 3
          ? 'Select Your Topics'
          : currentStep === 4
            ? 'Select Your Subtopics'
            : data.calibration.title;
  const stepDescription =
    currentStep === 1
      ? 'Pick the domain that best matches the evaluation you want to run. This choice shapes the subject and topic blueprint that follows.'
      : currentStep === 2
        ? `${data.subjectSelection.descriptionPrefix} ${config.domain?.title ?? data.domainSelection.emptyDomainPrompt.toLowerCase()}.`
        : currentStep === 3
          ? data.topicSelection.description.replace('{maxSelections}', String(data.topicSelection.maxSelections))
          : currentStep === 4
            ? data.subtopicSelection.description
            : data.calibration.description;

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-slate-50">
      <header role="banner" className="flex-none">
        {showActiveSession && activeSession !== null && (
          <div className="flex flex-col items-center justify-between gap-3 px-4 py-2 text-center text-white transition-colors duration-300 sm:flex-row sm:py-2.5 sm:text-left" style={{ backgroundColor: brandConfig.primaryColorDark }}>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
              <div>
                <p className="text-sm font-bold sm:text-[15px] sm:font-semibold">{data.labels.activeSessionTitle}</p>
                <p className="text-[10px] text-white/90 sm:text-xs">{`"${activeSession.title}" is currently active`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push(`/exam?examId=${encodeURIComponent(activeSession.examId)}`)} aria-label="Resume active session" className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold shadow-sm transition-colors hover:bg-gray-100 sm:px-4 sm:text-sm" style={{ color: brandConfig.primaryColorDark }}>
                {data.labels.activeSessionResumeLabel}
              </button>
              <button onClick={() => setShowActiveSession(false)} aria-label="Dismiss banner" className="rounded-full p-1 transition-all hover:scale-110 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
          <div className="w-full">
            <div className="grid gap-3 lg:gap-4 xl:grid-cols-[minmax(320px,1fr)_auto] xl:items-start">
              <div className="min-w-0 max-w-full">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] sm:text-xs" style={{ color: brandConfig.primaryColor }}>
                  {data.labels.startConfigurationLabel}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">{brandConfig.name}</h1>
                <p className="mt-1.5 max-w-xl break-words text-sm font-medium leading-6 text-slate-500">
                  {data.labels.shellDescription}
                </p>
              </div>

              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 sm:gap-4 xl:justify-end">
                <Link
                  href="/dashboard"
                  aria-label="Return to dashboard"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
                  style={{ backgroundColor: brandConfig.secondaryColor }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden xs:block">Back</span>
                </Link>
                <div className="ml-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 sm:ml-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:text-xs">{data.labels.basicModeLabel}</span>
                  <button
                    aria-label="Toggle Expert Mode"
                    onClick={() => setExpertMode(!expertMode)}
                    className={`relative h-5 w-10 rounded-full transition-colors sm:h-6 sm:w-12 ${expertMode ? '' : 'bg-gray-200'}`}
                    style={expertMode ? { backgroundColor: brandConfig.primaryColor } : {}}
                  >
                    <div className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform sm:left-1 sm:top-1 ${expertMode ? 'translate-x-5 sm:translate-x-6' : ''}`} />
                  </button>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:text-xs">{data.labels.expertModeLabel}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="relative flex min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden" role="main">
        <div className="flex w-full min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="min-w-0 p-4 pb-20 sm:p-6 md:pb-6 lg:p-8 xl:p-10">
            <div className="w-full min-w-0">
              <div className="mb-4 rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:px-5 sm:py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: brandConfig.primaryColor }}>
                      {data.labels.stepCounterLabel.replace('{current}', String(currentStep)).replace('{total}', String(data.steps.length))}
                    </p>
                    <h2 className="mt-1 break-words text-2xl font-bold text-slate-800 sm:text-3xl">{stepHeading}</h2>
                    <p className="mt-1.5 max-w-3xl text-sm text-slate-600">
                      {stepDescription}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 lg:min-w-[180px]">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{data.labels.currentFocusLabel}</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{currentStepConfig.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="w-full min-w-0 lg:min-h-[500px]">
                {currentStep === 1 && <DomainSelection selected={config.domain} onSelect={(domain) => setConfig({ ...config, domain })} />}
                {currentStep === 2 && <SubjectSelection domain={config.domain} selected={config.subjects} onSelect={(subjects) => setConfig({ ...config, subjects })} />}
                {currentStep === 3 && <TopicSelection selected={config.topics} onSelect={(topics) => setConfig({ ...config, topics })} subjects={config.subjects} maxSelections={data.topicSelection.maxSelections} />}
                {currentStep === 4 && <SubtopicSelection topics={config.topics} selected={config.subtopics} onSelect={(subtopics) => setConfig({ ...config, subtopics })} />}
                {currentStep === 5 && (
                  <EngineCalibration
                    difficulty={config.difficulty}
                    questionCount={config.questionCount}
                    onDifficultyChange={(difficulty) => setConfig({ ...config, difficulty })}
                    onQuestionCountChange={(questionCount) => setConfig({ ...config, questionCount })}
                  />
                )}
              </div>

              {showFinalSummary && (
                <div className="mt-6 w-full min-w-0">
                  <AssessmentSummary
                    config={config}
                    currentStep={currentStep}
                    questionAvailability={questionAvailability}
                    availabilityLoading={availabilityLoading}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 w-full max-w-full overflow-x-hidden border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 md:relative md:py-4 md:backdrop-blur-0">
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2.5 sm:gap-3">
            <button onClick={handleBack} disabled={currentStep === 1} aria-label="Go to previous step" className="flex min-w-0 items-center gap-2 rounded-xl border border-transparent px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-sm">
              <ChevronLeft className="h-5 w-5" />
              {data.labels.backLabel}
            </button>

            <div className="order-3 w-full text-center text-xs font-semibold text-gray-600 sm:order-none sm:w-auto sm:text-sm">
              {launchError ?? data.labels.stepCounterLabel.replace('{current}', String(currentStep)).replace('{total}', String(data.steps.length))}
            </div>

            <button onClick={() => void handleAdvance()} disabled={!canAdvance() || isLaunching || (currentStep === data.steps.length && questionAvailability !== null && questionAvailability.total < config.questionCount)} aria-label={currentStep === data.steps.length ? data.labels.launchLabel : data.labels.continueLabel} className="flex min-w-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm" style={{ backgroundColor: brandConfig.primaryColor }}>
              {isLaunching ? 'Launching...' : currentStep === data.steps.length ? data.labels.launchLabel : data.labels.continueLabel}
              {currentStep < data.steps.length && <ChevronRight className="h-5 w-5" />}
              {currentStep === data.steps.length && <Zap className="h-5 w-5" />}
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
                <h3 className="text-lg font-bold text-slate-800">{data.labels.exitDialogTitle}</h3>
                <p className="text-sm text-gray-600">{data.labels.exitDialogDescription}</p>
              </div>
            </div>
            <p className="mb-6 text-gray-700">{data.labels.exitDialogBody}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitDialog(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50">
                {data.labels.continueEditingLabel}
              </button>
              <button aria-label="Confirm exit and discard progress" className="flex-1 rounded-lg px-4 py-2.5 font-medium text-white shadow-lg transition-all hover:opacity-90" style={{ backgroundColor: brandConfig.primaryColor }}>
                {data.labels.exitAnywayLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
