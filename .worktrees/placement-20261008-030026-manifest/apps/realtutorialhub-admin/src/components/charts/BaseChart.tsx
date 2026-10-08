"use client";

import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

/**
 * BaseChart Wrapper Component (Admin)
 * 
 * Standardized chart rendering across the Admin ecosystem.
 */
const ReactECharts = dynamic(() => import("echarts-for-react"), {
    ssr: false,
    loading: () => <div className="w-full bg-slate-50 animate-pulse border border-slate-200 rounded-xl" style={{ height: "100%" }} />
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
    const memoOption = useMemo(() => option, [option]);

    return (
        <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
            <ReactECharts
                option={memoOption}
                notMerge={true}
                lazyUpdate={true}
                showLoading={loading}
                style={{ height: "100%", width: "100%" }}
            />
        </div>
    );
}
