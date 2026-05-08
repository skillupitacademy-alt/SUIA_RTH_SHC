'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function PracticeTestContent({ 
  data,
  onNext
}: { 
  data?: SubtopicNotesViewData['mainContent']['practiceTest'];
  onNext?: () => void;
}) {
  const brand = useBrand();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  
  if (!data) return null;

  // Combine all questions from different sections
  const allQuestions = [
    ...(data.conceptRecallQuestions?.questions || []),
    ...(data.scenarioBasedQuestions?.scenarios.map(s => ({
      id: s.id,
      questionNumber: 0, // Will be set below
      type: 'scenario',
      points: 5,
      question: s.decisionQuestion,
      options: s.options,
      correctAnswer: s.correctAnswer,
      explanation: s.explanation,
      difficulty: s.difficulty,
      scenarioContext: {
        title: s.scenarioTitle,
        problem: s.realWorldProblem,
        businessContext: s.businessContext
      }
    })) || [])
  ].map((q, idx) => ({ ...q, questionNumber: idx + 1 }));

  const totalQuestions = allQuestions.length;
  const currentQuestion = allQuestions[currentQuestionIndex];

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
    if (data.instantFeedback?.enabled && data.instantFeedback.feedbackType === 'immediate') {
      setShowFeedback(true);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Show intro screen if test hasn't started
  if (!testStarted && data.assessmentIntro) {
    return (
      <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:space-y-12">
        <h2 className="sr-only">Practice Test</h2>
        
        {/* Assessment Intro */}
        <section aria-label="Practice test introduction" className="rounded-[32px] bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-xl border border-indigo-100 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {data.assessmentIntro.badge}
            </div>
            <h3 className="text-2xl font-bold text-slate-950">{data.assessmentIntro.headline}</h3>
          </div>

          <p className="text-[16px] font-medium text-slate-800 leading-relaxed mb-6">{data.assessmentIntro.testDescription}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-5 rounded-xl bg-white border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Icons.BarChart size={18} className="text-indigo-600" aria-hidden="true" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Difficulty</h4>
              </div>
              <p className="text-[14px] font-medium text-slate-700">{data.assessmentIntro.difficultyOverview}</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Icons.Target size={18} className="text-indigo-600" aria-hidden="true" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Learning Goals</h4>
              </div>
              <ul className="space-y-2">
                {data.assessmentIntro.learningGoals.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Icons.CheckCircle size={14} className="text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-slate-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-indigo-100 border border-indigo-200 mb-8">
            <div className="flex items-start gap-3">
              <Icons.Info size={20} className="text-indigo-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-2">Readiness Check:</h4>
                <p className="text-[14px] font-medium text-indigo-900">{data.assessmentIntro.readinessIndicator}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setTestStarted(true)}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-[16px] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Start Practice Test
              <Icons.ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:space-y-12">
      
      <h2 className="sr-only">Practice Test Questions</h2>

      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">Your Progress</p>
          <p className="text-sm font-bold text-slate-950">{Math.round(progress)}%</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Question {currentQuestion?.questionNumber} of {totalQuestions}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <section aria-label={`Practice test question ${currentQuestion.questionNumber} of ${totalQuestions}`} className="relative space-y-8 rounded-[32px] bg-white/80 backdrop-blur-xl p-5 shadow-2xl border-t border-white/60 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-10">
          
          {/* Question Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-100">
                Q{currentQuestion.questionNumber}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                <Icons.ListChecks size={14} aria-hidden="true" /> {currentQuestion.type}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                <Icons.Star size={14} className="text-amber-900" fill="currentColor" aria-hidden="true" /> {currentQuestion.points} Points
              </div>
              {currentQuestion.difficulty && (
                <div className={`rounded-lg px-3 py-1.5 text-[10px] font-bold border ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-900 border-green-200' :
                  currentQuestion.difficulty === 'medium' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                  'bg-red-100 text-red-900 border-red-200'
                }`}>
                  {currentQuestion.difficulty.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Scenario Context (if applicable) */}
          {(currentQuestion as any).scenarioContext && (
            <div className="p-5 rounded-xl bg-blue-50 border border-blue-200">
              <h4 className="text-[15px] font-bold text-blue-900 mb-3">{(currentQuestion as any).scenarioContext.title}</h4>
              <p className="text-[14px] font-medium text-blue-800 mb-3">{(currentQuestion as any).scenarioContext.problem}</p>
              <p className="text-[13px] font-medium text-blue-700 italic">{(currentQuestion as any).scenarioContext.businessContext}</p>
            </div>
          )}

          {/* Question */}
          <h3 className="text-xl font-bold text-slate-950 leading-tight">{currentQuestion.question}</h3>

          {/* Code Block (if applicable) */}
          {(currentQuestion as any).code && (
            <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-4 font-mono text-[12px] leading-relaxed shadow-2xl sm:p-6 sm:text-sm">
              <pre className="whitespace-pre-wrap break-words text-indigo-100">
                {(currentQuestion as any).code.split('\n').map((line: string, i: number) => (
                  <div key={i} className="flex min-w-0 gap-3 sm:gap-4">
                    <span className="w-4 text-slate-600 select-none">{i + 1}</span>
                    <span className="min-w-0 break-words">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleAnswerSelect(opt.id)}
                disabled={showFeedback}
                className={`group flex items-center gap-6 rounded-2xl p-6 transition-all border-t shadow-sm hover:shadow-xl hover:-translate-y-2 disabled:cursor-not-allowed ${
                  selectedAnswer === opt.id 
                    ? showFeedback && opt.id === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-50/50 ring-4 ring-green-500/5 shadow-green-100/50'
                      : showFeedback && opt.id !== currentQuestion.correctAnswer
                      ? 'border-red-500 bg-red-50/50 ring-4 ring-red-500/5 shadow-red-100/50'
                      : 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/5 shadow-indigo-100/50'
                    : 'border-white/60 bg-white/40 hover:bg-white/80'
                }`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                  selectedAnswer === opt.id 
                    ? showFeedback && opt.id === currentQuestion.correctAnswer
                      ? 'border-green-900 bg-green-900'
                      : showFeedback && opt.id !== currentQuestion.correctAnswer
                      ? 'border-red-900 bg-red-900'
                      : 'border-indigo-900 bg-indigo-900'
                    : 'border-slate-300 group-hover:border-slate-400'
                }`}>
                  {selectedAnswer === opt.id && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <span className={`text-sm font-semibold ${
                  selectedAnswer === opt.id 
                    ? showFeedback && opt.id === currentQuestion.correctAnswer
                      ? 'text-green-950'
                      : showFeedback && opt.id !== currentQuestion.correctAnswer
                      ? 'text-red-950'
                      : 'text-indigo-950'
                    : 'text-slate-900'
                }`}>
                  <span className="mr-4 text-[12px] opacity-70 font-bold">{opt.id}</span>
                  {opt.text}
                </span>
                {showFeedback && opt.id === currentQuestion.correctAnswer && (
                  <Icons.CheckCircle size={24} className="ml-auto text-green-600" aria-hidden="true" />
                )}
                {showFeedback && selectedAnswer === opt.id && opt.id !== currentQuestion.correctAnswer && (
                  <Icons.XCircle size={24} className="ml-auto text-red-600" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          {/* Feedback Explanation */}
          {showFeedback && (
            <div className="rounded-[24px] bg-indigo-50/50 backdrop-blur-md p-8 flex items-start gap-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 border-t border-white/60">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm text-indigo-600 relative z-10 border border-indigo-100">
                <Icons.Lightbulb size={24} aria-hidden="true" />
              </div>
              <div className="space-y-2 relative z-10">
                <h4 className="text-sm font-bold text-indigo-950">Explanation</h4>
                <p className="text-[13px] text-indigo-900 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Icons.Zap size={100} className="text-indigo-500" />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.ArrowLeft size={16} aria-hidden="true" />
              Previous
            </button>

            {!showFeedback && selectedAnswer && (
              <button
                onClick={() => setShowFeedback(true)}
                className="px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Check Answer
              </button>
            )}

            {showFeedback && (
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === totalQuestions - 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Next Question
                <Icons.ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* Performance Analytics (shown at the end) */}
      {currentQuestionIndex === totalQuestions - 1 && showFeedback && data.performanceAnalytics && (
        <section aria-label="Performance analytics" className="rounded-[32px] bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-xl border border-slate-200 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <Icons.BarChart size={24} className="text-slate-700" aria-hidden="true" />
            <h3 className="text-2xl font-bold text-slate-950">{data.performanceAnalytics.title}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-white border border-slate-200 text-center">
              <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest mb-2">Your Score</p>
              <p className="text-4xl font-bold text-slate-950 mb-1">{data.performanceAnalytics.scoreDisplay.percentage}%</p>
              <p className="text-[13px] font-medium text-slate-600">{data.performanceAnalytics.scoreDisplay.currentScore} / {data.performanceAnalytics.scoreDisplay.maxScore}</p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200 text-center">
              <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest mb-2">Mastery Level</p>
              <p className="text-4xl font-bold text-slate-950 mb-1">{data.performanceAnalytics.masteryPercentage}%</p>
              <p className="text-[13px] font-medium text-slate-600">Concept Mastery</p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200 text-center">
              <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest mb-2">Exam Readiness</p>
              <p className="text-4xl font-bold text-slate-950 mb-1">{data.performanceAnalytics.examReadinessScore}%</p>
              <p className="text-[13px] font-medium text-slate-600">Ready for Assessment</p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-blue-50 border border-blue-200">
            <h4 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4">Benchmark Comparison:</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-blue-800">Your Score:</span>
                <span className="text-[14px] font-bold text-blue-950">{data.performanceAnalytics.benchmarkComparison.userScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-blue-800">Average Score:</span>
                <span className="text-[14px] font-bold text-blue-950">{data.performanceAnalytics.benchmarkComparison.averageScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-blue-800">Top Score:</span>
                <span className="text-[14px] font-bold text-blue-950">{data.performanceAnalytics.benchmarkComparison.topScore}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Revision Recommendations (shown at the end) */}
      {currentQuestionIndex === totalQuestions - 1 && showFeedback && data.revisionRecommendations && (
        <section aria-label="Revision recommendations" className="rounded-[32px] bg-gradient-to-br from-purple-50 to-indigo-50 p-5 shadow-xl border border-purple-100 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <Icons.BookOpen size={24} className="text-purple-700" aria-hidden="true" />
            <h3 className="text-2xl font-bold text-slate-950">{data.revisionRecommendations.title}</h3>
          </div>

          <div className="space-y-6 mb-8">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Personalized Learning Path:</h4>
            {data.revisionRecommendations.personalizedLearningPath.map((path) => (
              <div key={path.id} className={`p-5 rounded-xl border-2 ${
                path.priority === 'high' ? 'bg-red-50 border-red-200' :
                path.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-[15px] font-bold text-slate-900">{path.topic}</h5>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                    path.priority === 'high' ? 'bg-red-100 text-red-900' :
                    path.priority === 'medium' ? 'bg-amber-100 text-amber-900' :
                    'bg-green-100 text-green-900'
                  }`}>
                    {path.priority} Priority
                  </span>
                </div>
                <p className="text-[13px] font-medium text-slate-700 mb-3">Estimated Time: {path.estimatedTime}</p>
                <div className="flex flex-wrap gap-2">
                  {path.resources.map((resource, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-white text-[11px] font-bold text-slate-700 border border-slate-200">
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-xl bg-white border border-purple-200">
            <h4 className="text-sm font-bold text-purple-900 uppercase tracking-widest mb-4">Weakness Recovery Steps:</h4>
            <ul className="space-y-3">
              {data.revisionRecommendations.weaknessRecoverySteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-purple-900">
                    {idx + 1}
                  </div>
                  <span className="text-[14px] font-medium text-slate-700">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

    </div>
  );
}
