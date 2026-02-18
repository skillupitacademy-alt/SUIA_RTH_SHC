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
    PolarRadiusAxis,
    Line,
    LineChart,
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
    ComposedChart,
    Area
} from 'recharts';
import React from 'react';

export const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4 w-full">
        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">{title}</div>
        <div className="h-[260px] w-full">
            {children}
        </div>
    </div>
);

export const MasteryTreemap: React.FC<{ items: Array<{ name: string; value: number; fill?: string }> }> = ({ items }) => (
    <Card title="Mastery Sunburst (Treemap)">
        <ResponsiveContainer>
            <Treemap data={items} dataKey="value" stroke="#fff" fill="#10b981" />
        </ResponsiveContainer>
    </Card>
);

export const CompetencyRadar: React.FC<{ skills: Array<{ name: string; value: number }> }> = ({ skills }) => (
    <Card title="Competency Radar">
        <ResponsiveContainer>
            <RadarChart data={skills}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={45} domain={[0, 100]} />
                <Radar name="Skill" dataKey="value" stroke="#FF4B91" fill="#FF4B91" fillOpacity={0.35} />
            </RadarChart>
        </ResponsiveContainer>
    </Card>
);

export const LearningVelocity: React.FC<{ points: Array<{ label: string; value: number }> }> = ({ points }) => (
    <Card title="Learning Velocity">
        <ResponsiveContainer>
            <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                <Area dataKey="value" stroke="none" fill="#2563eb" fillOpacity={0.15} />
            </LineChart>
        </ResponsiveContainer>
    </Card>
);

export const KnowledgeTreemap: React.FC<{ items: Array<{ name: string; value: number; fill?: string }> }> = ({ items }) => (
    <Card title="Knowledge Volume Treemap">
        <ResponsiveContainer>
            <Treemap data={items} dataKey="value" stroke="#fff" />
        </ResponsiveContainer>
    </Card>
);

export const DifficultyBars: React.FC<{ bars: Array<{ label: string; simple: number; intermediate: number; expert: number }> }> = ({ bars }) => (
    <Card title="Difficulty Bridge">
        <ResponsiveContainer>
            <BarChart data={bars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="simple" fill="#10b981" name="Simple" />
                <Bar dataKey="intermediate" fill="#f59e0b" name="Intermediate" />
                <Bar dataKey="expert" fill="#ef4444" name="Expert" />
            </BarChart>
        </ResponsiveContainer>
    </Card>
);

export const SnapshotDonut: React.FC<{ correct: number; incorrect: number; skipped: number }> = ({ correct, incorrect, skipped }) => {
    const data = [
        { name: 'Correct', value: correct, fill: '#10b981' },
        { name: 'Incorrect', value: incorrect, fill: '#ef4444' },
        { name: 'Skipped', value: skipped, fill: '#94a3b8' },
    ];
    return (
        <Card title="Exam Snapshot">
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" />
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </Card>
    );
};

export const FluencyScatter: React.FC<{ points: Array<{ x: number; y: number; label: string; correct: boolean }> }> = ({ points }) => (
    <Card title="Fluency Scatter">
        <ResponsiveContainer>
            <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="Time (s)" />
                <YAxis dataKey="y" name="Accuracy" domain={[0, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <ReferenceLine x={Math.max(...points.map(p => p.x)) / 2} stroke="#cbd5e1" strokeDasharray="4 4" />
                <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="4 4" />
                <Scatter name="Questions" data={points} fill="#10b981" shape="circle" />
            </ScatterChart>
        </ResponsiveContainer>
    </Card>
);

export const RetentionFunnel: React.FC<{ stages: Array<{ label: string; value: number }> }> = ({ stages }) => (
    <Card title="Retention Funnel">
        <ResponsiveContainer>
            <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={stages} isAnimationActive fill="#FF4B91">
                    <LabelList position="right" fill="#334155" stroke="none" dataKey="label" />
                </Funnel>
            </FunnelChart>
        </ResponsiveContainer>
    </Card>
);

export const DeltaLollipop: React.FC<{ items: Array<{ label: string; value: number; baseline: number }> }> = ({ items }) => (
    <Card title="Delta vs Baseline">
        <ResponsiveContainer>
            <ComposedChart data={items} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="label" width={120} />
                <Tooltip />
                <Legend />
                <ReferenceLine x={70} stroke="#94a3b8" strokeDasharray="4 4" label="Baseline" />
                <Bar dataKey="value" barSize={10} fill="#0ea5e9" name="Score" />
                <Scatter dataKey="value" fill="#0f172a" name="Marker" />
            </ComposedChart>
        </ResponsiveContainer>
    </Card>
);
