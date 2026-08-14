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
  Lightbulb,
  Code,
  MessageCircle,
  Database,
  Shield,
  Gauge,
  Zap,
  Layers
} from 'lucide-react';

interface ExamSummaryReportProps {
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

interface ExamSummaryData {
  status: 'completed' | 'processing' | 'started' | 'failed' | 'abandoned';
  message?: string;
  examId: string;
  score: number;
  total: number;
  percentage: number;
  statusLabel?: 'passed' | 'failed';
  timeTaken?: string;
  percentile?: number;
  totalTimeSpentSeconds?: number;
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

async function fetchExamResult(examId: string): Promise<ExamSummaryData> {
  const response = await fetch(`/api/quiz/result?examId=${encodeURIComponent(examId)}`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch result');
  }

  return await response.json();
}

// Donut Progress Component (like reference image)
function DonutProgress({ 
  percentage, 
  size = 140, 
  strokeWidth = 16,
  color = '#e91e63',
  bgColor = '#f0f0f0',
  showLabel = true,
  label
}: { 
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
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
      {showLabel && label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs font-semibold text-gray-600">{label}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamSummaryReport({ brand, examId }: ExamSummaryReportProps) {
  const router = useRouter();
  const [result, setResult] = useState<ExamSummaryData | null>(null);
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
        const data = await fetchExamResult(examId);
        
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${brand.primaryColor}40`, borderTopColor: 'transparent' }}
          />
          <p className="text-lg font-semibold" style={{ color: brand.primaryColor }}>Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || result.status === 'processing' || result.status === 'started') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-white">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center border-2" style={{ borderColor: brand.primaryColor }}>
          <div 
            className="w-20 h-20 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6"
            style={{ borderColor: `${brand.primaryColor}40`, borderTopColor: 'transparent' }}
          />
          <h1 className="text-2xl font-bold mb-3" style={{ color: brand.primaryColor }}>
            {error ? 'Error Loading Results' : 'Calculating Your Results'}
          </h1>
          <p className="text-gray-600 mb-2">
            {error || result.message || 'Please wait while we analyze your performance...'}
          </p>
          {!error && <p className="text-sm text-gray-500">This usually takes 5-10 seconds</p>}
        </div>
      </div>
    );
  }

  const percentage = result.percentage ?? 0;
  const isPassed = percentage >= 70;
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
  const totalTimeSeconds = (result.totalTimeSpentSeconds || 0) % 60;
  const avgTimePerQuestion = totalQuestions > 0 ? Math.floor((result.totalTimeSpentSeconds || 0) / totalQuestions) : 0;
  
  // Find fastest and slowest questions
  const sortedByTime = [...(result.questions || [])].sort((a, b) => a.timeSpent - b.timeSpent);
  const fastestQuestion = sortedByTime[0];
  const slowestQuestion = sortedByTime[sortedByTime.length - 1];

  // Skill icons mapping
  const skillIcons = [
    { icon: Lightbulb, color: '#ff6b6b' },
    { icon: Code, color: '#4ecdc4' },
    { icon: MessageCircle, color: '#ff9f43' },
    { icon: Database, color: '#ee5a6f' },
    { icon: Shield, color: '#a55eea' },
    { icon: Gauge, color: '#26de81' },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header with Subject Logo and Title */}
        <div className="bg-blue-900 rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SubjectLogo 
              subject={result.lineage?.subject || result.lineage?.topic || 'Python'}
              primaryColor={brand.primaryColor}
              secondaryColor={brand.secondaryColor}
              size="lg"
            />
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-white opacity-90">
                {brand.name}
              </p>
              <h1 className="text-3xl font-black text-white mt-1">
                {result.lineage?.topic || 'EXAM SUMMARY'}
              </h1>
            </div>
          </div>

          {/* Top Info Pills */}
          <div className="flex items-center gap-6">
            <div className="bg-pink-600 rounded-xl px-4 py-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-white opacity-80">Exam Date</p>
                <p className="text-sm font-bold text-white">
                  {result.completedAt ? new Date(result.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'May 24, 2025'}
                </p>
              </div>
            </div>

            <div className="bg-pink-600 rounded-xl px-4 py-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-white opacity-80">Duration</p>
                <p className="text-sm font-bold text-white">
                  {String(totalTimeMinutes).padStart(2, '0')}:{String(totalTimeSeconds).padStart(2, '0')}:{String(Math.floor((result.totalTimeSpentSeconds || 0) % 1)).padStart(2, '0')}
                </p>
              </div>
            </div>

            <div className={`${isPassed ? 'bg-pink-600' : 'bg-red-600'} rounded-xl px-4 py-3 flex items-center gap-2`}>
              <Trophy className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-white opacity-80">Overall Result</p>
                <p className="text-sm font-black text-white uppercase">
                  {isPassed ? 'PASS' : 'RETRY'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Overall Performance */}
          <div className="col-span-3">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <div className="bg-pink-600 rounded-xl px-4 py-2 mb-6 inline-block">
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Overall Performance</h2>
              </div>

              {/* Main Score Donut */}
              <div className="relative flex items-center justify-center mb-6">
                <DonutProgress 
                  percentage={percentage}
                  size={160}
                  strokeWidth={18}
                  color={brand.primaryColor}
                  bgColor="#f0f0f0"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-black" style={{ color: brand.primaryColor }}>{correctCount}</div>
                  <div className="text-lg text-gray-400 font-bold">/ {totalQuestions}</div>
                  <div className="text-2xl font-black mt-1" style={{ color: brand.primaryColor }}>{Math.round(percentage)}%</div>
                  <div className="text-xs text-gray-500 font-semibold">Score</div>
                </div>
              </div>

              {/* Stats List with icons */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold text-gray-700">Correct Answers</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{correctCount}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-700">Incorrect Answers</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{incorrectCount}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <MinusCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-gray-700">Skipped Answers</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{skippedCount}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">Accuracy</span>
                  </div>
                  <span className="text-lg font-black text-gray-900">{Math.round(percentage)}%</span>
                </div>
              </div>

              {/* Result Badge */}
              <div className={`flex items-center gap-3 p-4 rounded-xl ${isPassed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                <Trophy className={`w-8 h-8 ${isPassed ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Result</p>
                  <p className={`text-xl font-black uppercase ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {isPassed ? 'PASS' : 'NEEDS IMPROVEMENT'}
                  </p>
                </div>
              </div>

              {/* Percentile Badge (if available) */}
              {result.percentile && result.percentile > 0 && (
                <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-300">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-sm font-bold text-yellow-800 mb-1">Great Job!</p>
                    <p className="text-sm text-gray-700">
                      You scored higher than <span className="font-black text-gray-900">{result.percentile}%</span> of candidates
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Performance Details */}
          <div className="col-span-6 space-y-6">
            {/* Performance by Difficulty */}
            {difficultyData.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                <div className="bg-pink-600 rounded-xl px-4 py-2 mb-6 inline-block">
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Performance by Difficulty</h2>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-4">
                  {simpleData && (
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center mb-3">
                        <DonutProgress 
                          percentage={simpleData.accuracy}
                          size={110}
                          strokeWidth={12}
                          color="#10b981"
                          bgColor="#f0f0f0"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-gray-900">{Math.round(simpleData.accuracy)}%</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">Simple</h3>
                      <p className="text-xs text-gray-600">({Math.round(simpleData.accuracy * simpleData.attempts / 100)} / {simpleData.attempts})</p>
                    </div>
                  )}

                  {intermediateData && (
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center mb-3">
                        <DonutProgress 
                          percentage={intermediateData.accuracy}
                          size={110}
                          strokeWidth={12}
                          color="#3b82f6"
                          bgColor="#f0f0f0"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-gray-900">{Math.round(intermediateData.accuracy)}%</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">Intermediate</h3>
                      <p className="text-xs text-gray-600">({Math.round(intermediateData.accuracy * intermediateData.attempts / 100)} / {intermediateData.attempts})</p>
                    </div>
                  )}

                  {expertData && (
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center mb-3">
                        <DonutProgress 
                          percentage={expertData.accuracy}
                          size={110}
                          strokeWidth={12}
                          color="#ec4899"
                          bgColor="#f0f0f0"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-gray-900">{Math.round(expertData.accuracy)}%</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">Expert</h3>
                      <p className="text-xs text-gray-600">({Math.round(expertData.accuracy * expertData.attempts / 100)} / {expertData.attempts})</p>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-4 gap-2 text-xs mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600 font-semibold">Simple (90-100%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600 font-semibold">Intermediate (70-89%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-600 font-semibold">Expert (50-69%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-600 font-semibold">Needs Improvement (&lt;50%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Concept Wise Performance (Highlights) */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <div className="bg-pink-600 rounded-xl px-4 py-2 mb-6 inline-block">
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Concept Wise Performance (Highlights)</h2>
              </div>

              <div className="flex items-center gap-6">
                {/* Python Logo Circle */}
                <div className="flex-shrink-0">
                  <div className="w-28 h-28 rounded-full bg-blue-500 flex items-center justify-center">
                    <SubjectLogo 
                      subject={result.lineage?.subject || 'Python'}
                      primaryColor="#3776ab"
                      secondaryColor="#ffd43b"
                      size="md"
                    />
                  </div>
                </div>

                {/* Performance bars */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-bold text-gray-900">Strong (80-100%)</span>
                      </div>
                      <span className="text-sm font-black text-gray-900">{simpleData?.attempts || 8} Concepts</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-bold text-gray-900">Average (50-79%)</span>
                      </div>
                      <span className="text-sm font-black text-gray-900">{intermediateData?.attempts || 4} Concepts</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-bold text-gray-900">Weak (&lt;50%)</span>
                      </div>
                      <span className="text-sm font-black text-gray-900">{expertData?.attempts || 3} Concepts</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Alert Box */}
                <div className="flex-shrink-0 w-64 bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-orange-900">
                      Keep strengthening weak concepts for better accuracy!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Tested */}
            {skillsData.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                <div className="bg-pink-600 rounded-xl px-4 py-2 mb-6 inline-block">
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Skills Tested</h2>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {skillsData.map((skill, idx) => {
                    const IconComponent = skillIcons[idx % skillIcons.length].icon;
                    const iconColor = skillIcons[idx % skillIcons.length].color;

                    return (
                      <div key={skill.id} className="text-center">
                        <div className="relative inline-flex items-center justify-center mb-3">
                          <DonutProgress 
                            percentage={skill.accuracy}
                            size={90}
                            strokeWidth={8}
                            color={iconColor}
                            bgColor="#f0f0f0"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${iconColor}20` }}
                            >
                              <IconComponent className="w-5 h-5" style={{ color: iconColor }} />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1">{skill.name}</h3>
                        <p className="text-xs text-gray-600 mb-1">{Math.round(skill.accuracy * skill.attempts / 100)} / {skill.attempts}</p>
                        <p className="text-lg font-black" style={{ color: iconColor }}>
                          {Math.round(skill.accuracy)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Question Status & Time Metrics */}
          <div className="col-span-3 space-y-6">
            {/* Question Status Overview */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <div className="bg-pink-600 rounded-xl px-4 py-2 mb-6 inline-block">
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Question Status Overview</h2>
              </div>

              <div className="relative flex items-center justify-center mb-6">
                <DonutProgress 
                  percentage={(correctCount / totalQuestions) * 100}
                  size={140}
                  strokeWidth={20}
                  color="#10b981"
                  bgColor="#f0f0f0"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-gray-900">{totalQuestions}</span>
                  <span className="text-xs text-gray-500 font-semibold">Total Questions</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-gray-700">Correct</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900">{correctCount}</span>
                    <span className="text-sm text-gray-500 ml-2">({Math.round((correctCount / totalQuestions) * 100)}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-gray-700">Incorrect</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900">{incorrectCount}</span>
                    <span className="text-sm text-gray-500 ml-2">({Math.round((incorrectCount / totalQuestions) * 100)}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MinusCircle className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-semibold text-gray-700">Skipped</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900">{skippedCount}</span>
                    <span className="text-sm text-gray-500 ml-2">({skippedCount > 0 ? Math.round((skippedCount / totalQuestions) * 100) : 0}%)</span>
                  </div>
                </div>
              </div>

              {/* Focus Banner */}
              <div className="p-3 rounded-xl bg-pink-50 border border-pink-300">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-pink-900">
                    Focus on expert level topics to improve further performance!
                  </p>
                </div>
              </div>
            </div>

            {/* Time Metrics */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm flex items-center gap-3">
                <Zap className="w-6 h-6 text-pink-600" />
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Total Time</p>
                  <p className="text-lg font-black text-gray-900">
                    {String(totalTimeMinutes).padStart(2, '0')}:{String(totalTimeSeconds).padStart(2, '0')}:{String(Math.floor((result.totalTimeSpentSeconds || 0) % 1)).padStart(2, '0')}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm flex items-center gap-3">
                <Timer className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Avg. Time / Question</p>
                  <p className="text-lg font-black text-gray-900">00:{String(avgTimePerQuestion).padStart(2, '0')}:{String(Math.floor((avgTimePerQuestion % 1) * 100)).padStart(2, '0')}</p>
                </div>
              </div>

              {fastestQuestion && (
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm flex items-center gap-3">
                  <Zap className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Fastest Question</p>
                    <p className="text-lg font-black text-gray-900">00:00:{String(fastestQuestion.timeSpent).padStart(2, '0')}</p>
                    <p className="text-xs text-gray-500">(Q{sortedByTime.indexOf(fastestQuestion) + 1})</p>
                  </div>
                </div>
              )}

              {slowestQuestion && (
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm flex items-center gap-3">
                  <Layers className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Slowest Question</p>
                    <p className="text-lg font-black text-gray-900">00:00:{String(slowestQuestion.timeSpent).padStart(2, '0')}</p>
                    <p className="text-xs text-gray-500">(Q{sortedByTime.indexOf(slowestQuestion) + 1})</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm flex items-center gap-3">
                <Layers className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Deepest Level Reached</p>
                  <p className="text-lg font-black text-gray-900">10</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm flex items-center gap-3">
                <Trophy className="w-6 h-6 text-pink-600" />
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Questions Attempted</p>
                  <p className="text-lg font-black text-gray-900">{totalQuestions} / {totalQuestions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-8 border-2 border-blue-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Next Steps</h2>
              <p className="text-gray-600">Continue your learning journey</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/launch-exam')}
              className="flex items-center gap-3 px-6 py-4 rounded-xl font-bold hover:scale-105 transition-transform"
              style={{ backgroundColor: brand.primaryColor, color: 'white' }}
            >
              <Trophy className="w-5 h-5" />
              <span>Take Another Exam</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white text-gray-900 font-bold hover:scale-105 transition-transform border-2 border-gray-300"
            >
              <Target className="w-5 h-5" style={{ color: brand.primaryColor }} />
              <span>View Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

