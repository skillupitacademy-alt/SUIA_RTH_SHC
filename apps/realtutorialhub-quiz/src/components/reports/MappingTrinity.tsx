'use client';

import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';

interface MappingTrinityProps {
    data: Array<{ name: string; accuracy: number }>;
    className?: string;
}

export function MappingTrinity({ data, className }: MappingTrinityProps) {
    const categories = [
        { key: 'CONCEPTUAL', label: 'Conceptual', color: 'bg-blue-500', border: 'border-blue-500/20' },
        { key: 'TECHNICAL', label: 'Technical', color: 'bg-purple-500', border: 'border-purple-500/20' },
        { key: 'PRACTICAL', label: 'Practical', color: 'bg-green-500', border: 'border-green-500/20' },
    ];

    const stats = categories.map(cat => {
        const item = data.find(d => d.name === cat.key);
        return {
            ...cat,
            accuracy: item ? item.accuracy : 0
        };
    });

    return (
        <div className={cn("glass-morphism rounded-[3rem] p-8 flex flex-col gap-8 border border-slate-200/50", className)}>
            <div className="flex items-center gap-3 w-full">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
                    <Target size={22} />
                </div>
                <h3 className="text-2xl font-black tracking-tight uppercase text-slate-900">Knowledge Trinity</h3>
            </div>

            <div className="space-y-6">
                {stats.map((stat) => (
                    <div key={stat.key} className="space-y-3">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-sm font-black tracking-tight text-slate-900">{stat.label}</span>
                                <span className="text-[10px] font-black text-slate-600 uppercase leading-none tracking-widest">Knowledge Type</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-black text-slate-950">{stat.accuracy}%</span>
                            </div>
                        </div>

                        <div className="h-4 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden p-0.5">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden",
                                    stat.color
                                )}
                                style={{ width: `${stat.accuracy}%` }}
                            >
                                {/* Glossy Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                                <div className="absolute inset-0 animate-pulse bg-white/10" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-700 leading-relaxed">
                    * Based on multi-dimensional analysis of problem-solving approach and theoretical accuracy.
                </p>
            </div>
        </div>
    );
}
