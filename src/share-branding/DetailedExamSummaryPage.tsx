'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandConfig } from './brandConfig';
import { SubjectLogo } from './components/SubjectLogo';
import {
  Calendar,
  Clock,
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Timer,
  Zap,
  TrendingUp,
  BookOpen,
  BarChart3,
  Award,
  Layers
} from 'lucide-react';

interface DetailedExamSummaryPageProps {
  brand: BrandConfig;
  examId?: string;
}

interface PerformanceMetric {
  id: string;
  name: string;
  score: number;
  accuracy: number;
  attempts: number;
}

interface QuestionDetail {
  id: string;
  text: string;
  userAnswer: string | null;
  correctAnswer?: string;
  explanation?: string;
  isCorrect: boolean;
  timeSpent: number;
}

interface DetailedExamData {
  status: 'completed' | 'processing' | 'started' | 'failed' | 'abandoned';
  message?: string;
  examId: string;
  score: number;
  total: number;
  percentage: number;
  statusLabel?: 'passed' | 'failed';
  timeTaken?: string;
  percentile?: number;
  mastery?: number;
  readiness?: number;
  totalTimeSpentSeconds?: number;
  timeEfficiency?: 'FAST' | 'OPTIMAL' | 'SLOW';
  stableCount?: number;
  logicCount?: number;
  errorCount?: number;
  performance?: {
    topic?: PerformanceMetric[];
    difficulty?: PerformanceMetric[];
    skill?: PerformanceMetric[];
    subtopic?: PerformanceMetric[];
  };
  questions?: QuestionDetail[];
  lineage?: {
    domain?: string;
    subject?: string;
    topic?: string;
  };
  completedAt?: string;
}

async function fetchDetailedResult(examId: string): Promise<DetailedExamData> {
  const response = await fetch(`/api/quiz/result?examId=${encodeURIComponent(examId)}`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch result');
  }

  return await response.json();
}

// Circular Progress Component
function CircularProgress({ 
  percentage, 
  size = 160, 
  strokeWidth = 12,
  color,
  bgColor = '#e5e7eb'
}: { 
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={bgColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export default function DetailedExamSummaryPage({ brand, examId }: DetailedExamSummaryPageProps) {
  const router = useRouter();
  const [result, setResult] = useState<DetailedExamData | null>(null);
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
        const data = await fetchDetailedResult(examId);
        
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

  if (loading || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e27' }}>
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${brand.primaryColor}40`, borderTopColor: 'transparent' }}
          />
          <p className="text-lg font-semibold text-white">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || result.status === 'processing' || result.status === 'started') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0e27' }}>
        <div className="max-w-lg w-full bg-slate-900 rounded-2xl shadow-2xl p-8 text-center border border-slate-800">
          <div 
            className="w-20 h-20 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6"
            style={{ borderColor: `${brand.primaryColor}40`, borderTopColor: 'transparent' }}
          />
          <h1 className="text-2xl font-bold text-white mb-3">
            {error ? 'Error Loading Results' : 'Calculating Your Results'}
          </h1>
          <p className="text-slate-400 mb-2">
            {error || result.message || 'Please wait while we analyze your performance...'}
          </p>
          {!error && <p className="text-sm text-slate-500">This usually takes 5-10 seconds</p>}
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
  const simpleData = difficultyData.find(d => d.name.toLowerCase().includes('simple'));
  const intermediateData = difficultyData.find(d => d.name.toLowerCase().includes('inter'));
  const expertData = difficultyData.find(d => d.name.toLowerCase().includes('expert'));

  // Get skills data
  const skillsData = result.performance?.skill?.slice(0, 6) ?? [];

  // Calculate time metrics
  const totalTimeMinutes = Math.floor((result.totalTimeSpentSeconds || 0) / 60);
  const avgTimePerQuestion = totalQuestions > 0 ? Math.floor((result.totalTimeSpentSeconds || 0) / totalQuestions) : 0;
  
  // Find fastest and slowest questions
  const sortedByTime = [...(result.questions || [])].sort((a, b) => a.timeSpent - b.timeSpent);
  const fastestQuestion = sortedByTime[0];
  const slowestQuestion = sortedByTime[sortedByTime.length - 1];

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8" style={{ background: '#0a0e27' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Subject Logo and Title */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <SubjectLogo 
                subject={result.lineage?.subject || result.lineage?.topic || 'Exam'}
                primaryColor={brand.primaryColor}
                secondaryColor={brand.secondaryColor}
                size="lg"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: brand.primaryColor }}>
                  {brand.name}
                </p>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                  {result.lineage?.topic || 'EXAM SUMMARY'}
                </h1>
              </div>
            </div>
          </div>

          {/* Top Info Bar */}
          <div className="grid grid-cols-3 gap-4 bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${brand.primaryColor}20` }}>
                <Calendar className="w-5 h-5" style={{ color: brand.primaryColor }} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Exam Date</p>
                <p className="text-sm font-bold text-white">
                  {result.completedAt ? new Date(result.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Duration</p>
                <p className="text-sm font-bold text-white">{result.timeTaken || '00:00:00'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPassed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {isPassed ? <Trophy className="w-5 h-5 text-green-400" /> : <Target className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Overall Result</p>
                <p className={`text-sm font-black uppercase ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                  {isPassed ? 'PASS' : 'RETRY'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Overall Performance */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overall Performance Card */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl px-4 py-2 mb-6 inline-block">
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Overall Performance</h2>
              </div>

              {/* Main Score Circle */}
              <div className="relative flex items-center justify-center mb-6">
                <CircularProgress 
                  percentage={percentage}
                  size={180}
                  strokeWidth={14}
                  color={brand.primaryColor}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-black text-white">{correctCount}</div>
                  <div className="text-xl text-slate-400 font-bold">/ {totalQuestions}</div>
                  <div className="text-2xl font-black mt-1" style={{ color: brand.primaryColor }}>{Math.round(percentage)}%</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Score</div>
                </div>
              </div>

              {/* Stats List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-slate-300">Correct Answers</span>
                  </div>
                  <span className="text-lg font-black text-white">{correctCount}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-slate-300">Incorrect Answers</span>
                  </div>
                  <span className="text-lg font-black text-white">{incorrectCount}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <MinusCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-slate-300">Skipped Answers</span>
                  </div>
                  <span className="text-lg font-black text-white">{skippedCount}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-slate-300">Accuracy</span>
                  </div>
                  <span className="text-lg font-black text-white">{Math.round(percentage)}%</span>
                </div>
              </div>

              {/* Result Badge */}
              <div className={`mt-6 flex items-center gap-3 p-4 rounded-2xl ${isPassed ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'}`}>
                <Trophy className={`w-8 h-8 ${isPassed ? 'text-green-400' : 'text-red-400'}`} />
                <div>
                  <p className="text-xs text-slate-400 font-semibold">Result</p>
                  <p className={`text-xl font-black uppercase ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                    {isPassed ? 'PASS' : 'NEEDS IMPROVEMENT'}
                  </p>
                </div>
              </div>

              {result.percentile && result.percentile > 0 && (
                <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
                  <TrendingUp className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-indigo-300 font-bold mb-1">Great Job!</p>
                    <p className="text-sm text-slate-300">
                      You scored higher than <span className="font-black text-white">{result.percentile}%</span> of candidates
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Middle & Right Columns - Performance Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance by Difficulty */}
            {difficultyData.length > 0 && (
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl px-4 py-2 mb-6 inline-block">
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Performance by Difficulty</h2>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {simpleData && (
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center mb-4">
                        <CircularProgress 
                          percentage={simpleData.accuracy}
                          size={120}
                          strokeWidth={10}
                          color="#10b981"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-white">{Math.round(simpleData.accuracy)}%</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">Simple</h3>
                      <p className="text-xs text-slate-500">({simpleData.score ?? simpleData.attempts} / {simpleData.attempts})</p>
                    </div>
                  )}

                  {intermediateData && (
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center mb-4">
                        <CircularProgress 
                          percentage={intermediateData.accuracy}
                          size={120}
                          strokeWidth={10}
                          color="#3b82f6"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-white">{Math.round(intermediateData.accuracy)}%</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">Intermediate</h3>
                      <p className="text-xs text-slate-500">({intermediateData.score ?? Math.round(intermediateData.accuracy * intermediateData.attempts / 100)} / {intermediateData.attempts})</p>
                    </div>
                  )}

                  {expertData && (
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center mb-4">
                        <CircularProgress 
                          percentage={expertData.accuracy}
                          size={120}
                          strokeWidth={10}
                          color="#ec4899"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-white">{Math.round(expertData.accuracy)}%</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">Expert</h3>
                      <p className="text-xs text-slate-500">({expertData.score ?? Math.round(expertData.accuracy * expertData.attempts / 100)} / {expertData.attempts})</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-slate-400 font-semibold">Simple (90-100%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-slate-400 font-semibold">Intermediate (70-89%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-slate-400 font-semibold">Expert (50-69%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-slate-400 font-semibold">Needs Improvement (&lt;50%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Question Status Overview */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl px-4 py-2 mb-6 inline-block">
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Question Status Overview</h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="relative inline-flex items-center justify-center">
                  <CircularProgress 
                    percentage={(correctCount / totalQuestions) * 100}
                    size={160}
                    strokeWidth={16}
                    color="#10b981"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">{totalQuestions}</span>
                    <span className="text-xs text-slate-500 font-semibold mt-1">Total Questions</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-semibold text-slate-300">Correct</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">{correctCount}</span>
                      <span className="text-sm text-slate-500 ml-2">({Math.round((correctCount / totalQuestions) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-semibold text-slate-300">Incorrect</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">{incorrectCount}</span>
                      <span className="text-sm text-slate-500 ml-2">({Math.round((incorrectCount / totalQuestions) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MinusCircle className="w-5 h-5 text-amber-400" />
                      <span className="text-sm font-semibold text-slate-300">Skipped</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">{skippedCount}</span>
                      <span className="text-sm text-slate-500 ml-2">({skippedCount > 0 ? Math.round((skippedCount / totalQuestions) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Focus Area Banner */}
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Focus on expert level topics to improve further performance!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Tested */}
            {skillsData.length > 0 && (
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl px-4 py-2 mb-6 inline-block">
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Skills Tested</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {skillsData.map((skill, idx) => {
                    const icons = [
                      { icon: Zap, color: '#ec4899' },
                      { icon: BookOpen, color: '#3b82f6' },
                      { icon: BarChart3, color: '#f59e0b' },
                      { icon: Target, color: '#10b981' },
                      { icon: Award, color: '#8b5cf6' },
                      { icon: Layers, color: '#06b6d4' },
                    ];
                    const IconComponent = icons[idx % icons.length].icon;
                    const iconColor = icons[idx % icons.length].color;

                    return (
                      <div key={skill.id} className="text-center">
                        <div className="relative inline-flex items-center justify-center mb-3">
                          <CircularProgress 
                            percentage={skill.accuracy}
                            size={80}
                            strokeWidth={6}
                            color={iconColor}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ background: `${iconColor}20` }}
                            >
                              <IconComponent className="w-5 h-5" style={{ color: iconColor }} />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">{skill.name}</h3>
                        <p className="text-xs text-slate-500">{skill.score ?? Math.round(skill.accuracy * skill.attempts / 100)} / {skill.attempts}</p>
                        <p className="text-lg font-black mt-1" style={{ color: iconColor }}>
                          {Math.round(skill.accuracy)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-slate-500 font-semibold">Total Time</span>
                </div>
                <p className="text-2xl font-black text-white">{result.timeTaken || '00:00'}</p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <Timer className="w-5 h-5 text-purple-400" />
                  <span className="text-xs text-slate-500 font-semibold">Avg. Time / Question</span>
                </div>
                <p className="text-2xl font-black text-white">{avgTimePerQuestion}s</p>
              </div>

              {fastestQuestion && (
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-green-400" />
                    <span className="text-xs text-slate-500 font-semibold">Fastest Question</span>
                  </div>
                  <p className="text-2xl font-black text-white">{fastestQuestion.timeSpent}s</p>
                </div>
              )}

              {slowestQuestion && (
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-red-400" />
                    <span className="text-xs text-slate-500 font-semibold">Slowest Question</span>
                  </div>
                  <p className="text-2xl font-black text-white">{slowestQuestion.timeSpent}s</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Next Steps</h2>
              <p className="text-slate-400">Continue your learning journey</p>
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
              className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/20"
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
