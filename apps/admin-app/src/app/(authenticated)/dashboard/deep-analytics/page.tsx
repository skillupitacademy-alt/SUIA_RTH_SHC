'use client';
import { apiClient } from '@quiz/api-client';

import { Layers, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ScoreProgressionChart } from '@/components/trends/ScoreProgressionChart';
import { SkillDeltaList } from '@/components/trends/SkillDeltaList';
import { TrendsRangeSelector } from '@/components/trends/TrendsRangeSelector';
import { TrendSummaryCards } from '@/components/trends/TrendSummaryCards';


interface SummaryData {
    avgScore: number;
    passRate: number;
    totalExams: number;
    bestSkill: { name: string; delta: number } | null;
    worstSkill: { name: string; delta: number } | null;
    currentStreak: number;
    deltaPct?: number | null;
    healthStatus?: 'green' | 'yellow' | 'red';
}

interface ScoreData {
    examId: string;
    date: string;
    score: number;
    passed: boolean;
    blueprintName: string | null;
}

interface SkillData {
    skillId: string;
    skillName: string;
    currentScore: number;
    previousScore: number | null;
    delta: number;
    trend: 'improving' | 'declining' | 'stable';
    sparkline: number[];
    predictedMasteryDate?: string | null;
    isStruggling?: boolean;
}

export default function DeepAnalyticsPage() {
    const [range, setRange] = useState('28d');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [scores, setScores] = useState<ScoreData[]>([]);
    const [skills, setSkills] = useState<SkillData[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (selectedRange: string) => {
        setLoading(true);
        setError(null);

        try {
            const [summaryRes, scoresRes, skillsRes] = await Promise.all([
                apiClient.admin.getTrendSummary({ range: selectedRange }),
                apiClient.admin.getScoreTrends({ range: selectedRange }),
                apiClient.admin.getSkillTrends({ range: selectedRange })
            ]);

            setSummary(summaryRes as SummaryData);
            setScores((scoresRes.scores != null ? scoresRes.scores : []) as ScoreData[]);
            setSkills((skillsRes.skills != null ? skillsRes.skills : []) as SkillData[]);
        } catch (err: unknown) {
            console.error('[DeepAnalyticsPage] Fetch error:', err);
            const message = err instanceof Error ? err.message : 'Failed to load trends data';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData(range);
    }, [range]);

    const handleRangeChange = (newRange: string) => {
        setRange(newRange);
    };

    const handleRetry = () => {
        void fetchData(range);
    };

    const triggerRefresh = async () => {
        setRefreshing(true);
        try {
            await apiClient.admin.createJob('ANALYTICS_REFRESH');
            // Give the worker a moment, then reload
            setTimeout(() => {
                void fetchData(range);
                setRefreshing(false);
            }, 2000);
        } catch (err) {
            console.error('Refresh trigger failed:', err);
            setRefreshing(false);
        }
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Standardized Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
                <DashboardPageHeader
                    title="Deep Analytics"
                    description="Materialized Scale Views and Historical Trajectories"
                    icon={<Layers className="text-blue-500" size={20} />}
                />
                <div className="flex items-center gap-4 pb-2">
                    <button
                        onClick={() => { void triggerRefresh(); }}
                        disabled={refreshing || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-medium disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                    <TrendsRangeSelector value={range} onChange={handleRangeChange} />
                </div>
            </div>

            {/* Loading State */}
            {loading === true ? <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div> : null}

            {/* Error State */}
            {(error !== null && loading === false) ? <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-800 font-medium mb-2">Error loading trends</p>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Retry
                </button>
            </div> : null}

            {/* Empty State */}
            {(loading === false && error === null && summary !== null && summary.totalExams === 0) ? <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <p className="text-slate-500 text-lg">No exam data yet for this range</p>
                <p className="text-slate-400 text-sm mt-2">Try selecting a longer time period</p>
            </div> : null}

            {/* Data Display */}
            {(loading === false && error === null && summary !== null && summary.totalExams > 0) ? <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Summary Cards */}
                <TrendSummaryCards summary={summary} />

                {/* Two-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ScoreProgressionChart scores={scores} passThreshold={70} />

                    {/* Skill Delta List */}
                    <SkillDeltaList skills={skills} />
                </div>
            </div> : null}

        </div>
    );
}
