'use client';

import { cn } from '@/lib/utils';
import { Star, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RemediationZoneProps {
    subtopicPerformance: Array<{ id: string; name: string; score: number; accuracy: number }>;
    className?: string;
}

export function RemediationZone({ subtopicPerformance, className }: RemediationZoneProps) {
    // Identify low-performance subtopics (< 70% accuracy)
    const growthZones = subtopicPerformance
        .filter(s => s.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy); // Focus on weakest first

    const masteredZones = subtopicPerformance
        .filter(s => s.accuracy >= 90)
        .sort((a, b) => b.accuracy - a.accuracy);

    return (
        <div className={cn("space-y-8", className)}>
            <div className="flex items-center gap-4">
                <Star className="text-primary animate-pulse" size={32} />
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase text-slate-900">Remediation Engine</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Intelligence-Driven Path</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Growth Zones */}
                <div className="glass-morphism rounded-[3rem] p-10 border-primary/30 space-y-8 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black tracking-tight text-primary">Priority Growth</h3>
                        <AlertTriangle className="text-primary" size={24} />
                    </div>

                    <div className="space-y-6">
                        {growthZones.length > 0 ? (
                            growthZones.slice(0, 3).map((zone) => (
                                <div key={zone.id} className="flex gap-5 p-6 rounded-[2rem] bg-white/80 border border-white shadow-sm group hover:border-primary/40 transition-all">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                        <TrendingUp size={28} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-base font-black text-black leading-tight tracking-tight">{zone.name}</p>
                                        <p className="text-xs font-black text-slate-800 leading-relaxed">
                                            Accuracy is at <span className="text-primary-900 font-extrabold">{zone.accuracy}%</span>. Focusing here could improve your overall score by <span className="text-primary-900 font-extrabold">{(100 - zone.accuracy) / 10}%</span>.
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 space-y-4">
                                <div className="h-20 w-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle2 size={40} />
                                </div>
                                <p className="text-base font-black text-slate-700 max-w-[240px] mx-auto">
                                    Outstanding consistency! No growth zones detected.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mastered Dimensions */}
                <div className="glass-morphism rounded-[3rem] p-10 space-y-8 shadow-sm">
                    <h3 className="text-2xl font-black tracking-tight text-secondary">Verified Mastery</h3>

                    <div className="space-y-4">
                        {masteredZones.slice(0, 3).map((zone) => (
                            <div key={zone.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/60 border border-white shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 shadow-inner">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <span className="text-base font-black text-slate-900">{zone.name}</span>
                                </div>
                                <span className="text-sm font-black text-secondary uppercase tracking-widest">{zone.accuracy}%</span>
                            </div>
                        ))}

                        {masteredZones.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm font-bold text-muted-foreground italic">
                                    Continue practicing to reach 90%+ mastery in specific subtopics.
                                </p>
                            </div>
                        )}
                    </div>

                    {masteredZones.length > 0 && (
                        <div className="pt-4 px-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Executive Summary: You have achieved high-fidelity compliance in {masteredZones.length} subtopics.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
