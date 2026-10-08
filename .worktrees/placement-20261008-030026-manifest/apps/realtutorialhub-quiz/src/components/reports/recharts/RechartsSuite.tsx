'use client';

import {
    CartesianGrid,
    Legend,
    Pie,
    PieChart,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    Treemap,
    ScatterChart,
    Scatter,
    ResponsiveContainer,
    ReferenceLine,
    FunnelChart,
    Funnel,
    LabelList,
    Area,
    Cell,
    AreaChart
} from 'recharts';
import React from 'react';
import { Card, CardTitle, CardHeader, CardContent } from '@quiz/ui';
import { StableRenderGuard } from './StableRenderGuard';

// --- Premium Design Tokens ---
const COLORS = {
    emerald: ['#10b981', '#059669'],
    indigo: ['#6366f1', '#4f46e5'],
    rose: ['#f43f5e', '#e11d48'],
    amber: ['#f59e0b', '#d97706'],
    slate: ['#94a3b8', '#64748b'],
};

type SimpleTooltipPayload = {
    color?: string;
    name?: string;
    value?: number;
    payload?: { fill?: string; color?: string };
};

const CustomTooltip = (props: { active?: boolean; payload?: SimpleTooltipPayload[]; label?: string | number }) => {
    const { active, payload, label } = props;
    const items = payload ?? [];
    if (!active || items.length === 0) return null;

    return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl shadow-slate-200/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label || 'Metric'}</p>
            {items.map((p, i) => {
                const swatch =
                    p.color ||
                    (p.payload as { fill?: string; color?: string } | undefined)?.fill ||
                    (p.payload as { color?: string } | undefined)?.color ||
                    '#94a3b8';
                return (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: swatch }} />
                        <p className="text-sm font-black text-slate-800 tabular-nums">
                            {p.name}: <span className="text-primary">{p.value}%</span>
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

const ChartDefs = () => (
    <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.emerald[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.emerald[1]} stopOpacity={1} />
            </linearGradient>
            <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.indigo[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.indigo[1]} stopOpacity={1} />
            </linearGradient>
            <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.rose[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.rose[1]} stopOpacity={1} />
            </linearGradient>
        </defs>
    </svg>
);

export const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Card className="group relative bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1 border-white">
        <ChartDefs />
        <CardHeader className="flex-row items-center justify-between mb-2">
            <div>
                <CardTitle className="text-xs font-black text-slate-400 tracking-[0.2em]">{title}</CardTitle>
                <div className="h-1 w-8 bg-primary/20 rounded-full mt-2 group-hover:w-16 transition-all duration-500" />
            </div>
            <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
            </div>
        </CardHeader>
        <CardContent className="h-[400px] w-full p-8 pt-0">
            {children}
        </CardContent>
    </Card>
);

export const CompetencyRadar: React.FC<{ skills: Array<{ name: string; value: number }> }> = ({ skills }) => (
    <ChartCard title="Skill Capability Matrix (Radar)">
        <StableRenderGuard>
            <ResponsiveContainer minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                    <PolarGrid strokeOpacity={0.1} />
                    <PolarAngleAxis dataKey="name" tick={{ fill: COLORS.slate[1], fontSize: 10, fontWeight: 'bold' }} />
                    <Radar
                        name="Capability"
                        dataKey="value"
                        stroke={COLORS.indigo[0]}
                        strokeWidth={4}
                        fill={COLORS.indigo[0]}
                        fillOpacity={0.3}
                        dot={{ r: 4, fill: COLORS.indigo[0], strokeWidth: 2, stroke: '#fff' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </StableRenderGuard>
    </ChartCard>
);

export const LearningVelocity: React.FC<{ points: Array<{ label: string; value: number }> }> = ({ points }) => (
    <ChartCard title="Learning Velocity & Momentum">
        <StableRenderGuard>
            <ResponsiveContainer minWidth={0} minHeight={0}>
                <AreaChart data={points}>
                    <defs>
                        <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="10 10" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" hide />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        fill="url(#velocityFill)"
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </StableRenderGuard>
    </ChartCard>
);

export const MasteryTreemap: React.FC<{ items: Array<{ name: string; value: number }> }> = ({ items }) => (
    <ChartCard title="Structural Hierarchy (Treemap)">
        <StableRenderGuard>
            <ResponsiveContainer minWidth={0} minHeight={0}>
                <Treemap
                    data={items}
                    dataKey="value"
                    stroke="#fff"
                    fill="#10b981"
                >
                    <Tooltip content={<CustomTooltip />} />
                </Treemap>
            </ResponsiveContainer>
        </StableRenderGuard>
    </ChartCard>
);

export const MasterySunburst: React.FC<{ items: Array<{ name: string; value: number; fill?: string }> }> = ({ items }) => (
    <ChartCard title="Structural Hierarchy (Sunburst)">
        <StableRenderGuard>
            <ResponsiveContainer minWidth={0} minHeight={0}>
                <PieChart>
                    <Pie
                        data={items}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="30%"
                        outerRadius="95%"
                        paddingAngle={2}
                        animationBegin={500}
                        cornerRadius={6}
                    >
                        {items.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill || COLORS.emerald[0]} stroke="#fff" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
        </StableRenderGuard>
    </ChartCard>
);

export const DifficultyBars: React.FC<{ bars: Array<{ label: string; simple: number; intermediate: number; expert: number }> }> = ({ bars }) => (
    <ChartCard title="The Expertise Bridge (Difficulty Clusters)">
        <StableRenderGuard>
            <ResponsiveContainer minWidth={0} minHeight={0}>
                <BarChart data={bars} barGap={12}>
                    <CartesianGrid strokeDasharray="10 10" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 40, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Bar dataKey="simple" radius={[10, 10, 0, 0]} fill="url(#emeraldGradient)" name="CORE" />
                    <Bar dataKey="intermediate" radius={[10, 10, 0, 0]} fill="url(#indigoGradient)" name="APPLIED" />
                    <Bar dataKey="expert" radius={[10, 10, 0, 0]} fill="url(#roseGradient)" name="SURGICAL" />
                </BarChart>
            </ResponsiveContainer>
        </StableRenderGuard>
    </ChartCard>
);

export const SnapshotDonut: React.FC<{ correct: number; incorrect: number; skipped: number }> = ({ correct, incorrect, skipped }) => {
    const data = [
        { name: 'Succeeded', value: correct, color: 'url(#emeraldGradient)' },
        { name: 'Compromised', value: incorrect, color: 'url(#roseGradient)' },
        { name: 'Bypassed', value: skipped, color: '#f1f5f9' },
    ];
    return (
        <ChartCard title="Operational Snapshot">
            <StableRenderGuard>
                <ResponsiveContainer minWidth={0} minHeight={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="65%"
                            outerRadius="90%"
                            paddingAngle={8}
                            animationBegin={500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-slate-900 font-black text-2xl"
                        >
                            {Math.round((correct / (correct + incorrect + skipped || 1)) * 100)}%
                        </text>
                        <text
                            x="50%"
                            y="58%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-slate-400 font-bold text-[10px] uppercase tracking-widest"
                        >
                            Mastery
                        </text>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ paddingLeft: 40, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }} />
                    </PieChart>
                </ResponsiveContainer>
            </StableRenderGuard>
        </ChartCard>
    );
};

export const RetentionFunnel: React.FC<{ stages: Array<{ label: string; value: number }> }> = ({ stages }) => (
    <ChartCard title="Survival Attrition (Retention Funnel)">
        <StableRenderGuard>
            <ResponsiveContainer minWidth={0} minHeight={0}>
                <FunnelChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Funnel dataKey="value" data={stages} isAnimationActive stroke="none">
                        <Cell fill="url(#indigoGradient)" fillOpacity={1} />
                        <Cell fill="url(#indigoGradient)" fillOpacity={0.8} />
                        <Cell fill="url(#indigoGradient)" fillOpacity={0.6} />
                        <LabelList position="center" fill="#fff" stroke="none" dataKey="label" style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>
        </StableRenderGuard>
    </ChartCard>
);

export const FluencyScatter: React.FC<{ points: Array<{ x: number; y: number; label: string }> }> = ({ points }) => (
    <ChartCard title="Cognitive Fluency (Speed vs Accuracy)">
        <StableRenderGuard>
            <ResponsiveContainer minWidth={0} minHeight={0}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Reaction Time" unit="s" label={{ value: 'Response Time (s)', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 800 }} />
                    <YAxis type="number" dataKey="y" name="Precision" unit="%" domain={[0, 100]} label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 800 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={4} stroke="#f43f5e" strokeDasharray="10 10" label={{ value: 'Lag Threshold', position: 'top', fill: '#f43f5e', fontSize: 8, fontWeight: 900 }} />
                    <ReferenceLine y={70} stroke="#10b981" strokeDasharray="10 10" label={{ value: 'Mastery Line', position: 'right', fill: '#10b981', fontSize: 8, fontWeight: 900 }} />
                    <Scatter name="Tasks" data={points} fill="#6366f1">
                        {points.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.y > 70 ? '#10b981' : '#6366f1'} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </StableRenderGuard>
    </ChartCard>
);
