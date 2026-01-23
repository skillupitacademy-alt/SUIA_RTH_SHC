'use client';

export function ProgressChart() {
    const data = [40, 65, 55, 80, 75, 90, 85];
    const max = Math.max(...data);
    const width = 600;
    const height = 200;
    const step = width / (data.length - 1);

    const points = data.map((d, i) => `${i * step},${height - (d / max) * height}`).join(' ');

    return (
        <div className="p-8 rounded-3xl border bg-background shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold">Performance Trends</h3>
                    <p className="text-sm text-muted-foreground">Your success rate over the last 7 days</p>
                </div>
                <select className="bg-muted/50 border-none rounded-lg px-3 py-1 text-sm font-medium focus:ring-0">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                </select>
            </div>

            <div className="relative flex-1 min-h-[150px] mt-4">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
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
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                        className="drop-shadow-sm"
                    />

                    {/* Dots */}
                    {data.map((d, i) => (
                        <circle
                            key={i}
                            cx={i * step}
                            cy={height - (d / max) * height}
                            r="6"
                            fill="hsl(var(--background))"
                            stroke="hsl(var(--primary))"
                            strokeWidth="3"
                        />
                    ))}

                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div className="flex justify-between mt-6 px-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <span key={day} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{day}</span>
                ))}
            </div>
        </div>
    );
}
