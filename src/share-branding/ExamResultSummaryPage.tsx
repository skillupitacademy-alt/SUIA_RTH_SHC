'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandConfig } from './brandConfig';
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Lightbulb,
  Calendar,
  BarChart3,
  BookOpen,
  Zap
} from 'lucide-react';

interface ExamResultSummaryPageProps {
  brand: BrandConfig;
  examId?: string;
}

interface PerformanceMetric {
  id: string;
  name: string;
  score: number;
  accuracy: number;
}

interface QuestionDetail {
  text: string;
  userAnswer: string | null;
  correctAnswer?: string;
  explanation?: string;
  isCorrect: boolean;
  timeSpent: number;
}

interface ExamResultData {
  status: 'completed' | 'processing' | 'started' | 'failed' | 'abandoned';
  message?: string;
  score?: number;
  total?: number;
  percentage?: number;
  statusLabel?: 'passed' | 'failed';
  timeTaken?: string;
  percentile?: number;
  performance?: {
    topic?: PerformanceMetric[];
    difficulty?: PerformanceMetric[];
    skill?: PerformanceMetric[];
    subtopic?: PerformanceMetric[];
  };
  questions?: QuestionDetail[];
}

async function fetchResult(examId: string): Promise<ExamResultData> {
  const response = await fetch(`/api/quiz/result?examId=${encodeURIComponent(examId)}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch result');
  }

  return await response.json();
}

export default function ExamResultSummaryPage({ brand, examId }: ExamResultSummaryPageProps) {
  const router = useRouter();
  const [result, setResult] = useState<ExamResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!examId) {
      setError('Missing exam ID');
      setLoading(false);
      return;
    }

    const loadResult = async () => {
      try {
        const data = await fetchResult(examId);
        
        // If still processing, poll again
        if (data.status === 'processing' || data.status === 'started') {
          if (retryCount < 20) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, retryCount < 3 ? 2000 : retryCount < 8 ? 4000 : 6000);
          }
          setResult(data);
          setLoading(false);
          return;
        }

        setResult(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load result');
        setLoading(false);
      }
    };

    loadResult();
  }, [examId, retryCount]);

  if (!examId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Result Unavailable</h1>
          <p className="text-slate-600 mb-6">Missing exam identifier</p>
          <button
            onClick={() => router.push('/launch-exam')}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Launch New Exam
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${brand.primaryColor}40`, borderTopColor: 'transparent' }}
          />
          <p className="text-lg font-semibold text-slate-700">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Result</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-xl font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Handle processing state
  if (result.status === 'processing' || result.status === 'started') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div 
            className="w-20 h-20 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6"
            style={{ borderColor: `${brand.primaryColor}40`, borderTopColor: 'transparent' }}
          />
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Calculating Your Results</h1>
          <p className="text-slate-600 mb-2">{result.message || 'Please wait while we analyze your performance...'}</p>
          <p className="text-sm text-slate-500">This usually takes 5-10 seconds</p>
        </div>
      </div>
    );
  }

  const percentage = result.percentage ?? 0;
  const isPassed = (result.statusLabel || percentage >= 70) === 'passed';
  const correctCount = result.questions?.filter(q => q.isCorrect).length ?? result.score ?? 0;
  const totalQuestions = result.questions?.length ?? result.total ?? 0;
  const incorrectCount = totalQuestions - correctCount;
  const skippedCount = result.questions?.filter(q => !q.userAnswer).length ?? 0;

  // Get difficulty breakdown
  const difficultyData = result.performance?.difficulty ?? [];
  const simpleAccuracy = difficultyData.find(d => d.name.toLowerCase().includes('simple'))?.accuracy ?? 0;
  const intermediateAccuracy = difficultyData.find(d => d.name.toLowerCase().includes('inter'))?.accuracy ?? 0;
  const expertAccuracy = difficultyData.find(d => d.name.toLowerCase().includes('expert'))?.accuracy ?? 0;

  // Get top skills
  const skillData = result.performance?.skill?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Brand Logo */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: brand.primaryColor }}>
              {brand.name}
            </p>
            <h1 className="text-3xl font-black text-slate-900 mt-1">Exam Summary</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Main Result Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2" style={{ borderColor: `${brand.primaryColor}20` }}>
          <div 
            className="px-8 py-6 text-white"
            style={{ 
              background: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.primaryColorDark} 100%)` 
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-2">Overall Performance</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black">{Math.round(percentage)}%</span>
                  <span className="text-2xl font-bold text-white/90">({correctCount}/{totalQuestions})</span>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-2xl font-black text-lg uppercase tracking-wide ${
                isPassed ? 'bg-green-500' : 'bg-red-500'
              } text-white shadow-lg`}>
                {isPassed ? (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    <span>PASS</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    <span>RETRY</span>
                  </div>
                )}
              </div>
            </div>

            {result.percentile && result.percentile > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2 text-white/90">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    You scored higher than {result.percentile}% of candidates
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{correctCount}</div>
              <div className="text-sm font-semibold text-slate-600 mt-1">Correct</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 mb-3">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{incorrectCount}</div>
              <div className="text-sm font-semibold text-slate-600 mt-1">Incorrect</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {totalQuestions > 0 ? Math.round((incorrectCount / totalQuestions) * 100) : 0}%
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-3">
                <MinusCircle className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{skippedCount}</div>
              <div className="text-sm font-semibold text-slate-600 mt-1">Skipped</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {totalQuestions > 0 ? Math.round((skippedCount / totalQuestions) * 100) : 0}%
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-3">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{result.timeTaken || '00:00'}</div>
              <div className="text-sm font-semibold text-slate-600 mt-1">Time Taken</div>
              <div className="text-xs text-slate-500 mt-0.5">Duration</div>
            </div>
          </div>
        </div>

        {/* Performance by Difficulty */}
        {difficultyData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${brand.primaryColor}15` }}
              >
                <BarChart3 className="w-5 h-5" style={{ color: brand.primaryColor }} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Performance by Difficulty</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {difficultyData.map((diff, idx) => {
                const colors = [
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500' },
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
                  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', bar: 'bg-purple-500' },
                ];
                const color = colors[idx % colors.length];
                
                return (
                  <div key={diff.id} className={`${color.bg} border-2 ${color.border} rounded-2xl p-6`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-bold ${color.text} capitalize`}>{diff.name}</h3>
                      <span className={`text-2xl font-black ${color.text}`}>{Math.round(diff.accuracy)}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full ${color.bar} transition-all duration-500`}
                        style={{ width: `${diff.accuracy}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-2 font-semibold">
                      {diff.score ?? Math.round(diff.accuracy)} correct answers
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills Tested */}
        {skillData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${brand.secondaryColor}15` }}
              >
                <Zap className="w-5 h-5" style={{ color: brand.secondaryColor }} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Skills Tested</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillData.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: skill.accuracy >= 80 ? '#10b981' : skill.accuracy >= 50 ? '#f59e0b' : '#ef4444' 
                      }}
                    />
                    <span className="font-bold text-slate-900">{skill.name}</span>
                  </div>
                  <span className="text-lg font-black" style={{ 
                    color: skill.accuracy >= 80 ? '#10b981' : skill.accuracy >= 50 ? '#f59e0b' : '#ef4444' 
                  }}>
                    {Math.round(skill.accuracy)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-2">Next Steps</h2>
              <p className="text-slate-300 text-sm">Continue your learning journey</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/launch-exam')}
              className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white text-slate-900 font-bold hover:scale-105 transition-transform"
            >
              <BookOpen className="w-5 h-5" style={{ color: brand.primaryColor }} />
              <span>Take Another Exam</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
            >
              <BarChart3 className="w-5 h-5" />
              <span>View Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
