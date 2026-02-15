'use client';
import { format } from 'date-fns';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, type TooltipProps, XAxis, YAxis } from 'recharts';

interface ScoreProgressionChartProps {
    scores: Array<{
        examId: string;
        date: string;
        score: number;
        passed: boolean;
        blueprintName: string | null;
    }>;
    passThreshold?: number;
}

export function ScoreProgressionChart({ scores, passThreshold = 70 }: ScoreProgressionChartProps) {
    if (scores.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                <p className="text-slate-500">No score data available</p>
            </div>
        );
    }

    const chartData = scores.map(s => ({
        date: format(new Date(s.date), 'MMM dd'),
        score: s.score,
        passed: s.passed,
        blueprintName: (s.blueprintName != null && s.blueprintName !== '') ? s.blueprintName : 'Unknown',
        fullDate: format(new Date(s.date), 'PPP')
    }));

    const tooltipFormatter: TooltipProps<number, string>['formatter'] = (value, name, { payload }) => {
        if (name === 'score') {
            const blueprint = payload?.blueprintName ?? '';
            return [`${value}%`, blueprint];
        }
        return value;
    };

    const tooltipLabelFormatter: TooltipProps<number, string>['labelFormatter'] = (_label, payload) => {
        const first = (payload != null && payload.length > 0) ? payload[0] : null;
        return first?.payload?.fullDate ?? _label;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Score Progression
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={tooltipFormatter}
                        labelFormatter={tooltipLabelFormatter}
                    />
                    <ReferenceLine
                        y={passThreshold}
                        stroke="#94a3b8"
                        strokeDasharray="5 5"
                        label={{
                            value: `Pass (${passThreshold}%)`,
                            position: 'right',
                            fill: '#64748b',
                            fontSize: 12
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={(props: Record<string, unknown>) => {
                            const { cx, cy, payload } = props as { cx: number, cy: number, payload: { passed: boolean } };
                            const isPassed = (payload as { passed: boolean }).passed === true;
                            return (
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={4}
                                    fill={isPassed ? '#16a34a' : '#dc2626'}
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            );
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
