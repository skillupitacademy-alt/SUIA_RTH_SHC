'use client';

import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface BehavioralRadarProps {
    data: Array<{ name: string; accuracy: number }>;
    className?: string;
}

export function BehavioralRadar({ data, className }: BehavioralRadarProps) {
    // Map internal technical names to display names
    const displayNames: Record<string, string> = {
        TECHNICAL: 'Technical',
        COGNITIVE: 'Cognitive',
        PROCESS: 'Process'
    };

    const categories = ['TECHNICAL', 'COGNITIVE', 'PROCESS'];
    const values = categories.map(cat => {
        const item = data.find(d => d.name === cat);
        return item ? item.accuracy : 0;
    });

    const size = 300;
    const center = size / 2;
    const radius = (size / 2) * 0.7; // Leave space for labels

    // Calculate coordinates for the radar points
    const points = values.map((val, i) => {
        const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
        const r = (val / 100) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    });

    const polygonPath = points.map(p => `${p.x},${p.y}`).join(' ');

    // Calculate coordinates for the axis lines and labels
    const axisLines = categories.map((_, i) => {
        const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
        return {
            x1: center,
            y1: center,
            x2: center + radius * Math.cos(angle),
            y2: center + radius * Math.sin(angle),
            labelX: center + (radius + 25) * Math.cos(angle),
            labelY: center + (radius + 15) * Math.sin(angle),
            name: displayNames[categories[i]] || categories[i]
        };
    });

    // Background hexagons (rings)
    const rings = [0.25, 0.5, 0.75, 1].map(scale => {
        return categories.map((_, i) => {
            const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2;
            const r = radius * scale;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
    });

    return (
        <div className={cn("glass-morphism rounded-[3rem] p-8 flex flex-col items-center gap-6", className)}>
            <div className="flex items-center gap-3 w-full mb-2">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
                    <Activity size={22} />
                </div>
                <h3 className="text-2xl font-black tracking-tight uppercase text-slate-900">Behavioral Radar</h3>
            </div>

            <div className="relative w-full aspect-square max-w-[300px]">
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-2xl">
                    {/* Background Rings */}
                    {rings.map((path, i) => (
                        <polygon
                            key={i}
                            points={path}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="text-muted-foreground/10"
                        />
                    ))}

                    {/* Axis Lines */}
                    {axisLines.map((line, i) => (
                        <line
                            key={i}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            className="text-muted-foreground/20"
                        />
                    ))}

                    {/* Data Polygon */}
                    <polygon
                        points={polygonPath}
                        fill="var(--primary-hex, rgba(255, 45, 85, 0.2))"
                        stroke="#FF2D55"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        style={{
                            fill: 'rgba(255, 45, 85, 0.25)',
                            filter: 'drop-shadow(0 0 8px rgba(255, 45, 85, 0.4))'
                        }}
                    />

                    {/* Labels */}
                    {axisLines.map((line, i) => (
                        <text
                            key={i}
                            x={line.labelX}
                            y={line.labelY}
                            textAnchor="middle"
                            className="text-[11px] font-black uppercase tracking-widest fill-black"
                        >
                            {line.name}
                        </text>
                    ))}

                    {/* Center Point */}
                    <circle cx={center} cy={center} r="3" fill="#FF2D55" />
                </svg>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
                {categories.map((cat, i) => (
                    <div key={cat} className="text-center px-2 py-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-700 uppercase mb-1 tracking-tighter">{displayNames[cat]}</p>
                        <p className="text-base font-black text-primary drop-shadow-sm">{values[i]}%</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
