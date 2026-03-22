"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { EChartsOption } from "echarts";

/**
 * BaseChart Wrapper Component
 * 
 * WHY: 
 * 1. Prevents Hydration errors (SSR: false)
 * 2. Optimizes bundle by lazy-loading ECharts engine
 * 3. Provides unified loading and responsive handling
 */
const ReactECharts = dynamic(() => import("echarts-for-react"), {
    ssr: false,
    loading: () => <div className="w-full bg-slate-100 animate-pulse rounded-lg" style={{ height: "100%" }} />
});

interface BaseChartProps {
    option: EChartsOption;
    height?: number | string;
    loading?: boolean;
    className?: string;
}

export default function BaseChart({
    option,
    height = 400,
    loading = false,
    className = "",
}: BaseChartProps) {
    // Memoize options to prevent unnecessary re-renders when parent state changes
    const memoOption = useMemo(() => option, [option]);

    return (
        <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
            <ReactECharts
                option={memoOption}
                notMerge={true}
                lazyUpdate={true}
                showLoading={loading}
                theme="light"
                style={{ height: "100%", width: "100%" }}
                opts={{ renderer: 'svg' }} // SVG is often sharper for line/bar charts
            />
        </div>
    );
}
