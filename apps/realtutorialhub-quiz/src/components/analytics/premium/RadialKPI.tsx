'use client';

import React, { useMemo } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface RadialKPIProps {
    score: number;
    mastery: number;
    readiness: number;
    status: 'READY' | 'BORDERLINE' | 'NOT READY';
}

export const RadialKPI = React.memo(({ score, mastery, readiness, status }: RadialKPIProps) => {
    const data = useMemo(() => [
        { name: 'Readiness', value: readiness, fill: '#f59e0b' }, // amber-500
        { name: 'Mastery', value: mastery, fill: '#10b981' },    // emerald-500
        { name: 'Score', value: score, fill: '#6366f1' },       // indigo-500
    ], [score, mastery, readiness]);

    const statusConfig = {
        READY: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        BORDERLINE: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        'NOT READY': { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    };

    return (
        <div className="relative w-full h-[400px] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[100px]" />
            </div>

            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="100%"
                    barSize={12}
                    data={data}
                    startAngle={90}
                    endAngle={450}
                >
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                    />
                    <RadialBar
                        background={{ fill: '#1e293b' }}
                        cornerRadius={10}
                        dataKey="value"
                        animationDuration={1500}
                        animationEasing="ease-out"
                    />
                </RadialBarChart>
            </ResponsiveContainer>

            {/* Center Intelligence Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="space-y-1"
                >
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Overall Accuracy</span>
                    <div className="flex items-baseline justify-center">
                        <span className="text-7xl font-black text-white tracking-tighter tracking-tight">
                            {score}
                        </span>
                        <span className="text-2xl font-black text-indigo-500 ml-1">%</span>
                    </div>

                    <div className={cn(
                        "mt-4 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest animate-pulse",
                        statusConfig[status].bg,
                        statusConfig[status].color,
                        statusConfig[status].border
                    )}>
                        Status: {status}
                    </div>
                </motion.div>
            </div>

            {/* Legend / Metrics */}
            <div className="absolute bottom-10 inset-x-0 px-10 flex justify-between items-end">
                <div className="flex flex-col gap-1 items-start">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mastery</span>
                    <span className="text-xl font-black text-emerald-500">{mastery}%</span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Readiness</span>
                    <span className="text-xl font-black text-amber-500">{readiness}%</span>
                </div>
            </div>
        </div>
    );
});

RadialKPI.displayName = 'RadialKPI';
