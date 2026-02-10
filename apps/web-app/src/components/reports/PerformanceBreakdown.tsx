import { TrendingUp, BookOpen, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceBreakdownProps {
    topics: Array<{ name: string; score: number; total: number }>;
    difficulty: Array<{ level: string; accuracy: number }>;
    growthZones: Array<{ topic: string; suggestion: string }>;
}

export function PerformanceBreakdown({ topics, difficulty, growthZones }: PerformanceBreakdownProps) {
    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Topic Mastery */}
            <div className="p-8 rounded-[3rem] border bg-background shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black tracking-tight">Topic Mastery</h3>
                    <BookOpen className="text-primary" size={20} />
                </div>
                <div className="space-y-6">
                    {topics.map((topic) => {
                        const percentage = Math.round((topic.score / topic.total) * 100);
                        return (
                            <div key={topic.name} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="font-black text-sm text-slate-900 uppercase tracking-tight">{topic.name}</span>
                                    <span className="text-xs font-black text-slate-600">{percentage}%</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-1000 rounded-full",
                                            percentage > 70 ? "bg-green-500" : percentage > 40 ? "bg-secondary" : "bg-primary"
                                        )}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detail Analytics */}
            <div className="space-y-8">
                {/* Difficulty Breakdown */}
                <div className="p-8 rounded-[3rem] border bg-background shadow-sm">
                    <h3 className="text-xl font-black tracking-tight mb-8 text-slate-900">Difficulty Breakdown</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {difficulty.map((d) => (
                            <div key={d.level} className="text-center p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">{d.level}</p>
                                <p className="text-3xl font-black text-primary drop-shadow-sm">{d.accuracy}%</p>
                                <div className="mt-3 text-[10px] font-black py-1.5 px-3 rounded-full bg-slate-50 border border-slate-100 uppercase tracking-widest text-slate-600">
                                    Accuracy
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Growth Zones */}
                <div className="p-8 rounded-[3rem] bg-secondary/5 border-2 border-secondary/10">
                    <div className="flex items-center gap-3 mb-6">
                        <Star className="text-secondary fill-current" size={24} />
                        <h3 className="text-xl font-black tracking-tight text-secondary">Identified Growth Zones</h3>
                    </div>
                    <div className="space-y-4">
                        {growthZones.length > 0 ? (
                            growthZones.map((zone, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/60">
                                    <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                        <TrendingUp size={20} />
                                    </div>
                                    <p className="text-sm font-bold leading-relaxed">
                                        {zone.suggestion}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="flex gap-4 p-4 rounded-2xl bg-green-100/60 transition-colors">
                                <div className="h-10 w-10 rounded-xl bg-green-200 text-green-700 flex items-center justify-center shrink-0">
                                    <TrendingUp size={20} />
                                </div>
                                <p className="text-sm font-bold leading-relaxed text-green-800">
                                    No immediate growth zones. You maintained excellent consistency across all topics!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
