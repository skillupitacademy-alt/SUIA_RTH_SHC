'use client';

import React from 'react';
import { cn } from "@/lib/utils";

interface BreakdownItem {
    name: string;
    count: number;
    avgScore: number;
}

interface StackedBarBreakdownProps {
    data?: BreakdownItem[];
}

export function StackedBarBreakdown({ data = [] }: StackedBarBreakdownProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Dimension Data Available</p>
            </div>
        );
    }

    const totalAttempts = data.reduce((acc, item) => acc + item.count, 0);

    return (
        <div className="space-y-8 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-[#1A1A1A]">Dimension Breakdown</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Attempts by Domain & Subject</p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Total: {totalAttempts} Attempts</span>
                </div>
            </div>

            <div className="space-y-6">
                {data.map((item, idx) => {
                    const percentage = Math.round((item.count / totalAttempts) * 100);
                    return (
                        <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="text-[#1A1A1A]">{item.name}</span>
                                <span className="text-slate-400">{item.count} attempts • {item.avgScore}% Avg</span>
                            </div>
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        idx % 3 === 0 ? "bg-[#FF2D55]" : idx % 3 === 1 ? "bg-[#FF9500]" : "bg-[#5856D6]"
                                    )}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Distribution by Volume</span>
                <span>Accuracy Focus Index</span>
            </div>
        </div>
    );
}
