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
            <div className="flex items-center gap-3">
                <Star className="text-primary animate-pulse" size={28} />
                <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">Remediation Engine</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Intelligence-Driven Path</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Growth Zones */}
                <div className="glass-morphism rounded-[3rem] p-8 border-primary/20 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black tracking-tight text-primary">Priority Growth Zones</h3>
                        <AlertTriangle className="text-primary" size={20} />
                    </div>

                    <div className="space-y-4">
                        {growthZones.length > 0 ? (
                            growthZones.slice(0, 3).map((zone) => (
                                <div key={zone.id} className="flex gap-4 p-5 rounded-3xl bg-white/60 border border-white/40 group hover:border-primary/30 transition-all">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-foreground">{zone.name}</p>
                                        <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                                            Accuracy is at <span className="text-primary">{zone.accuracy}%</span>. Focusing here could improve your overall score by {(100 - zone.accuracy) / 10}%.
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={32} />
                                </div>
                                <p className="text-sm font-bold text-muted-foreground max-w-[200px] mx-auto">
                                    Outstanding consistency! No immediate growth zones detected at this level.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mastered Dimensions */}
                <div className="glass-morphism rounded-[3rem] p-8 space-y-6 opacity-80">
                    <h3 className="text-xl font-black tracking-tight text-secondary">Verified Mastery</h3>

                    <div className="space-y-4">
                        {masteredZones.slice(0, 3).map((zone) => (
                            <div key={zone.id} className="flex items-center justify-between p-5 rounded-3xl bg-white/40 border border-white/20">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{zone.name}</span>
                                </div>
                                <span className="text-xs font-black text-secondary uppercase tracking-widest">{zone.accuracy}%</span>
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
