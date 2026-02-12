'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@quiz/api-client';
import { TrendSummaryCards } from '@/components/trends/TrendSummaryCards';
import { ScoreProgressionChart } from '@/components/trends/ScoreProgressionChart';
import { SkillDeltaList } from '@/components/trends/SkillDeltaList';
import { TrendsRangeSelector } from '@/components/trends/TrendsRangeSelector';

export default function TrendsPage() {
    const [range, setRange] = useState('28d');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    type TrendSummary = { totalExams: number } & Record<string, unknown>;
    const [summary, setSummary] = useState<TrendSummary | null>(null);
    const [scores, setScores] = useState<unknown[]>([]);
    const [skills, setSkills] = useState<unknown[]>([]);

    const fetchData = async (selectedRange: string) => {
        setLoading(true);
        setError(null);

        try {
            const [summaryRes, scoresRes, skillsRes] = await Promise.all([
                apiClient.admin.getTrendSummary({ range: selectedRange }),
                apiClient.admin.getScoreTrends({ range: selectedRange }),
                apiClient.admin.getSkillTrends({ range: selectedRange })
            ]);

            setSummary(summaryRes);
            setScores(scoresRes?.scores || []);
            setSkills(skillsRes?.skills || []);
        } catch (err: unknown) {
            console.error('[TrendsPage] Fetch error:', err);
            const message = err instanceof Error ? err.message : 'Failed to load trends data';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(range);
    }, [range]);

    const handleRangeChange = (newRange: string) => {
        setRange(newRange);
    };

    const handleRetry = () => {
        fetchData(range);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Performance Trends</h1>
                        <p className="text-slate-600 mt-1">Historical analytics and skill improvements</p>
                    </div>
                    <TrendsRangeSelector value={range} onChange={handleRangeChange} />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-800 font-medium mb-2">Error loading trends</p>
                        <p className="text-red-600 text-sm mb-4">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && summary && summary.totalExams === 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                        <p className="text-slate-500 text-lg">No exam data yet for this range</p>
                        <p className="text-slate-400 text-sm mt-2">Try selecting a longer time period</p>
                    </div>
                )}

                {/* Data Display */}
                {!loading && !error && summary && summary.totalExams > 0 && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <TrendSummaryCards summary={summary} />

                        {/* Two-Column Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Score Progression Chart */}
                            <ScoreProgressionChart scores={scores} passThreshold={70} />

                            {/* Skill Delta List */}
                            <SkillDeltaList skills={skills} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
