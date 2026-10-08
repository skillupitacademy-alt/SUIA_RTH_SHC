"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * SHARED REPORT CARD
 * Universal card shell used by both Web UI and PDF.
 * Guarantees identical radius, border, padding, and background.
 */
export function ReportCard({
    children,
    height,
    className,
}: {
    children: React.ReactNode;
    height?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "bg-slate-900/40 border border-slate-800/50 rounded-3xl p-8 h-full flex flex-col w-full max-w-none",
                className
            )}
            style={height ? { height, minHeight: height } : undefined}
        >
            {children}
        </div>
    );
}

/**
 * CHART CARD
 * ReportCard pre-configured for chart centering.
 */
export function ChartCard({
    height,
    children,
    className,
}: {
    height?: number;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <ReportCard height={height} className={className}>
            <div className="h-full flex items-center justify-center flex-1">
                {children}
            </div>
        </ReportCard>
    );
}
