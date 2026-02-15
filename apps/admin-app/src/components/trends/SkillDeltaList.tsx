'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SkillDeltaListProps {
    skills: Array<{
        skillId: string;
        skillName: string;
        currentScore: number;
        previousScore: number | null;
        delta: number;
        trend: 'improving' | 'declining' | 'stable';
        sparkline: number[];
    }>;
}

export function SkillDeltaList({ skills }: SkillDeltaListProps) {
    if (skills.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                <p className="text-slate-500">No skill data available</p>
            </div>
        );
    }

    const getDeltaColor = (delta: number) => {
        if (delta > 5) return 'text-green-600 bg-green-50';
        if (delta < -5) return 'text-red-600 bg-red-50';
        return 'text-slate-600 bg-slate-50';
    };

    const getDeltaIcon = (delta: number) => {
        if (delta > 5) return '↑';
        if (delta < -5) return '↓';
        return '→';
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Skill Improvements
            </h3>
            <div className="space-y-3">
                {skills.map((skill) => (
                    <div
                        key={skill.skillId}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex-1">
                            <div className="font-medium text-slate-900">{skill.skillName}</div>
                            <div className="text-sm text-slate-600">
                                Current: {skill.currentScore}%
                                {skill.previousScore !== null && (
                                    <span className="ml-2">
                                        (Previous: {skill.previousScore}%)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Sparkline */}
                            {skill.sparkline.length > 1 && (
                                <div className="w-24 h-12">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={skill.sparkline.map((score, idx) => ({ score, idx }))}>
                                            <Area
                                                type="monotone"
                                                dataKey="score"
                                                stroke={skill.delta > 0 ? '#16a34a' : '#dc2626'}
                                                fill={skill.delta > 0 ? '#dcfce7' : '#fee2e2'}
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Delta Badge */}
                            <div
                                className={`px-3 py-1 rounded-full font-semibold text-sm ${getDeltaColor(skill.delta)}`}
                            >
                                {getDeltaIcon(skill.delta)} {skill.delta > 0 ? '+' : ''}{skill.delta}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
