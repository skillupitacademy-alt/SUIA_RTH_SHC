import { useDashboardStore } from '@/store/dashboard-store';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ProgressChart({ trendData = [] }: { trendData?: Array<{ score: number; date: string }> }) {
    const { fetchDashboard } = useDashboardStore();
    const [range, setRange] = useState('7d');

    const handleRangeChange = (newRange: string) => {
        setRange(newRange);
        fetchDashboard(newRange);
    };

    // If no data, show a flat base line
    const displayData = trendData.length > 0 ? trendData : [{ score: 0, date: 'N/A' }, { score: 0, date: 'N/A' }];
    const max = 100; // Always baseline to 100%
    const width = 600;
    const height = 150; // Reduced height
    const step = width / (displayData.length - 1 || 1);

    const points = displayData.map((d, i) => `${i * step},${height - (d.score / max) * height}`).join(' ');

    return (
        <div className="p-8 rounded-xl border-2 border-gray-200 bg-white shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Recent Scores (%)</h3>
                    <p className="text-sm text-gray-600">Accuracy trend over last {displayData.length} completed exams</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => handleRangeChange('7d')}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                            range === '7d' ? "bg-white shadow-sm text-pink-500" : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        7D
                    </button>
                    <button
                        onClick={() => handleRangeChange('30d')}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                            range === '30d' ? "bg-white shadow-sm text-pink-500" : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        30D
                    </button>
                </div>
            </div>

            <div className="relative flex-1 min-h-[120px] mt-2 flex">
                {/* Y-Axis Label */}
                <div className="absolute -left-6 top-1/2 -rotate-90 origin-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 whitespace-nowrap">
                    Score (%)
                </div>

                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible ml-4">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                        <line
                            key={p}
                            x1="0" y1={height * p} x2={width} y2={height * p}
                            stroke="currentColor" strokeOpacity="0.05"
                        />
                    ))}

                    {/* Area */}
                    <path
                        d={`M 0,${height} L ${points} L ${width},${height} Z`}
                        fill="url(#gradient)"
                        className="text-primary opacity-10"
                    />

                    {/* Line */}
                    <polyline
                        fill="none"
                        stroke="#FF2D55"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                        className="drop-shadow-sm"
                    />

                    {/* Dots & Tooltips */}
                    {displayData.map((d, i) => {
                        const score = Number(d.score) || 0;
                        const cx = i * step;
                        const cy = height - (score / max) * height;

                        if (isNaN(cx) || isNaN(cy)) return null;

                        return (
                            <g key={i} className="group/dot">
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r="6"
                                    fill="white"
                                    stroke="#FF2D55"
                                    strokeWidth="3"
                                    className="cursor-pointer transition-all group-hover/dot:r-8"
                                />
                                <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity">
                                    <rect
                                        x={cx - 30}
                                        y={cy - 45}
                                        width="60"
                                        height="35"
                                        rx="8"
                                        fill="#FF2D55"
                                    />
                                    <text
                                        x={cx}
                                        y={cy - 28}
                                        textAnchor="middle"
                                        className="text-[10px] font-black fill-white"
                                    >
                                        {score}%
                                    </text>
                                    <text
                                        x={cx}
                                        y={cy - 18}
                                        textAnchor="middle"
                                        className="text-[8px] font-bold fill-white/80"
                                    >
                                        {d.date}
                                    </text>
                                </g>
                            </g>
                        );
                    })}

                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div className="flex justify-between mt-8 px-5">
                {displayData.map((d, i) => {
                    const showLabel = displayData.length > 10 ? i % 5 === 0 || i === displayData.length - 1 : true;
                    if (!showLabel) return <div key={i} className="w-0" />;
                    return (
                        <span key={i} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {d.date}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
