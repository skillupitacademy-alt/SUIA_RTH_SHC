'use client';

import React, { useEffect, useState } from 'react';
import {
  ExamSummaryReportProps,
  ExamSummaryData,
  PerformanceMetric,
} from './components/report/types';
import { ReportHeader } from './components/report/ReportHeader';
import { OverallPerformanceCard } from './components/report/OverallPerformanceCard';
import { SkillsTestedCard } from './components/report/SkillsTestedCard';
import { MetricsSummaryBar } from './components/report/MetricsSummaryBar';
import { ReportActions } from './components/report/ReportActions';

async function fetchExamResult(examId: string): Promise<ExamSummaryData> {
  const response = await fetch(`/api/quiz/result?examId=${encodeURIComponent(examId)}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch result');
  }

  return await response.json();
}

export default function ExamSummaryReport(props: ExamSummaryReportProps) {
  return <ExamSummaryReportForExam key={props.examId ?? ''} {...props} />;
}

function ExamSummaryReportForExam({ brand, examId }: ExamSummaryReportProps) {
  const [result, setResult] = useState<ExamSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadedExamId, setLoadedExamId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // FND14: Reset state immediately when examId changes to prevent stale result display
    if (loadedExamId !== examId) {
      setResult(null);
      setLoading(true);
      setError(null);
      setRetryCount(0);
      setLoadedExamId(examId);
    }

    if (!examId) {
      setError('Missing exam ID');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const loadResult = async () => {
      setError(null);
      try {
        const data = await fetchExamResult(examId);
        if (cancelled) return;

        if (data.status === 'processing' || data.status === 'started') {
          if (retryCount < 20) {
            retryTimer = setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, retryCount < 3 ? 2000 : retryCount < 8 ? 4000 : 6000);
          }
          setResult(data);
          setLoading(false);
          return;
        }

        setResult(data);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load result');
        setLoading(false);
      }
    };

    loadResult();
    return () => { cancelled = true; if (retryTimer) clearTimeout(retryTimer); };
  }, [examId, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: brand?.primaryColor || '#ff0055', borderTopColor: 'transparent' }}
          />
          <p className="text-lg font-bold text-gray-800">Loading Exam Results...</p>
        </div>
      </div>
    );
  }

  if (error || !result || result.status === 'processing' || result.status === 'started') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#f1f5f9]">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center border-2" style={{ borderColor: `${brand?.primaryColor || '#ff0055'}40` }}>
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6"
            style={{ borderColor: brand?.primaryColor || '#ff0055', borderTopColor: 'transparent' }}
          />
          <h1 className="text-2xl font-black mb-3 text-gray-900">
            {error ? 'Error Loading Results' : 'Calculating Your Results'}
          </h1>
          <p className="text-gray-600 mb-2 font-medium">
            {error || result?.message || 'Please wait while we evaluate your answers and compile detailed metrics...'}
          </p>
          {!error && <p className="text-xs text-gray-400">This usually takes 3-5 seconds</p>}
        </div>
      </div>
    );
  }

  if (!Number.isFinite(result.score) || !Number.isFinite(result.total) || !Number.isFinite(result.percentage)) {
    return <div className="min-h-screen flex items-center justify-center">Result data unavailable</div>;
  }

  // Aggregate score and total come from the report, not a potentially partial detail array.
  const allQuestions = result.questions ?? [];
  const totalQuestions = result.total;
  const correctCount = result.score;
  const hasCompleteQuestions = Array.isArray(result.questions) && allQuestions.length === totalQuestions;
  const answerIsKnown = (question: typeof allQuestions[number]) =>
    question.userAnswer === null || typeof question.userAnswer === 'string';
  const answeredQuestions = allQuestions.filter(
    (question) => typeof question.userAnswer === 'string' && question.userAnswer !== ''
  );
  const allAnswersKnown = hasCompleteQuestions && allQuestions.every(answerIsKnown);
  const allCorrectnessKnown = allAnswersKnown && answeredQuestions.every(
    (question) => typeof question.isCorrect === 'boolean'
  );
  const incorrectCount = allCorrectnessKnown ? answeredQuestions.filter((question) => question.isCorrect === false).length : null;
  const skippedCount = allAnswersKnown ? totalQuestions - answeredQuestions.length : null;
  const percentage = result.percentage;
  const isPassed = result.statusLabel === 'passed' ? true : result.statusLabel === 'failed' ? false : null;
  const percentile = result.percentile ?? null;

  // 2. Difficulty & Concept Metrics
  const difficultyData: PerformanceMetric[] = result.performance?.difficulty ?? [];
  const topicData: PerformanceMetric[] = result.performance?.topic ?? [];
  const measuredTopics = topicData.filter((topic) => topic.accuracy !== undefined);

  // 3. Dynamic Subject Name & Lineage
  const subject = result.lineage?.subject || result.lineage?.topic || 'Subject unavailable';
  const examSubjectName = result.lineage?.topic || result.lineage?.subject || 'Subject unavailable';
  const examDateStr = result.completedAt
    ? new Date(result.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date unavailable';

  const skillList = (result.performance?.skill ?? []).filter((skill) => skill.accuracy !== undefined).map((skill) => ({
    name: skill.name,
    icon: null,
    accuracy: skill.accuracy ?? null,
    score: skill.score ?? null,
    total: skill.total ?? skill.attempts ?? null,
  }));

  const totalTimeSeconds = result.totalTimeSpentSeconds ??
    (allQuestions.some((question) => question.timeSpent !== undefined)
      ? allQuestions.reduce((sum, question) => sum + (question.timeSpent ?? 0), 0)
      : null);
  const formatTime = (value: number | null) => value === null ? 'Unavailable' :
    `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor((value % 3600) / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  const formattedTotalTime = formatTime(totalTimeSeconds);
  const formattedAvgTime = formatTime(totalTimeSeconds !== null && totalQuestions > 0 ? Math.floor(totalTimeSeconds / totalQuestions) : null);
  const sortedByTime = [...allQuestions].filter((question) => question.timeSpent !== undefined)
    .sort((a, b) => (a.timeSpent ?? 0) - (b.timeSpent ?? 0));
  const fastest = sortedByTime[0];
  const slowest = sortedByTime[sortedByTime.length - 1];
  const formattedFastest = formatTime(fastest?.timeSpent ?? null);
  const formattedSlowest = formatTime(slowest?.timeSpent ?? null);
  const fastestLabel = fastest ? `Q${allQuestions.indexOf(fastest) + 1}` : 'Unavailable';
  const slowestLabel = slowest ? `Q${allQuestions.indexOf(slowest) + 1}` : 'Unavailable';

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6 lg:px-8 bg-[#f1f5f9]">
      <div className="max-w-[1380px] mx-auto space-y-4">
        {/* ===================== 1. HEADER BANNER ===================== */}
        <ReportHeader
          subject={subject}
          examSubjectName={examSubjectName}
          examDateStr={examDateStr}
          formattedTotalTime={formattedTotalTime}
          isPassed={isPassed}
          primaryColor={brand?.primaryColor}
          secondaryColor={brand?.secondaryColor}
        />

        {/* ===================== 2. ROW 1: THREE MAIN CARDS ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OverallPerformanceCard
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            skippedCount={skippedCount}
            totalQuestions={totalQuestions}
            percentage={percentage}
            isPassed={isPassed}
            percentile={percentile}
          />

          {difficultyData.length > 0 ? <div>
            {difficultyData.map((metric, index) => <p key={metric.id ?? index}>{metric.name}: {metric.accuracy === undefined ? 'Unavailable' : `${metric.accuracy}%`}</p>)}
          </div> : <p>Difficulty performance unavailable</p>}

          {hasCompleteQuestions && allAnswersKnown ? <div>
            <p>Correct: {correctCount}</p>
            <p>Incorrect: {incorrectCount ?? 'Unavailable'}</p>
            <p>Skipped: {skippedCount ?? 'Unavailable'}</p>
          </div> : <p>Question details unavailable</p>}
        </div>

        {/* ===================== 3. ROW 2: CONCEPTS & SKILLS ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {measuredTopics.length > 0 ? <div>
            {measuredTopics.map((topic, index) => <p key={topic.id ?? index}>{topic.name}: {topic.accuracy}%</p>)}
          </div> : <p>Concept performance unavailable</p>}

          <SkillsTestedCard skillList={skillList} />
        </div>

        {/* ===================== 4. ROW 3: BOTTOM 6 METRICS BAR ===================== */}
        <MetricsSummaryBar
          formattedTotalTime={formattedTotalTime}
          formattedAvgTime={formattedAvgTime}
          formattedFastest={formattedFastest}
          formattedSlowest={formattedSlowest}
          fastestLabel={fastestLabel}
          slowestLabel={slowestLabel}
          deepestLevel={null}
          totalQuestions={totalQuestions}
          attemptedQuestions={allAnswersKnown ? answeredQuestions.length : null}
        />

        {/* ===================== 5. NEXT STEPS ACTIONS ===================== */}
        <ReportActions />
      </div>
    </div>
  );
}
