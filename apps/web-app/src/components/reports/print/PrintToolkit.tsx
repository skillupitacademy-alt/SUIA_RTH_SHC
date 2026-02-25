"use client";

import React from "react";
import { REPORT_LAYOUT } from "@/lib/reportLayoutTokens";

/**
 * PDF PAGE MODEL
 * Consumes REPORT_LAYOUT tokens for dimensions, ensuring Web ⇄ PDF parity.
 */
interface PdfPageProps {
    children: React.ReactNode;
    orientation?: "landscape" | "portrait";
}

export function PdfPage({ children, orientation = "landscape" }: PdfPageProps) {
    const dim = orientation === "landscape" ? REPORT_LAYOUT.page.landscape : REPORT_LAYOUT.page.portrait;
    const debug = process.env.NEXT_PUBLIC_DEBUG_PDF_BORDERS === "true";
    return (
        <div
            className={`pdf-page ${orientation} relative flex flex-col bg-[#0B1220] text-slate-100 overflow-hidden select-none ${debug ? "pdf-debug-border" : ""}`}
            style={{
                width: dim.width,
                height: dim.height,
                padding: dim.padding,
                boxSizing: "border-box",
                pageBreakAfter: "always",
                breakAfter: "page",
            }}
        >
            {children}
        </div>
    );
}

/**
 * STABLE TWO-COLUMN GRID
 * Default ratios come from REPORT_LAYOUT.grid tokens.
 */
interface PdfGridTwoColumnProps {
    left: React.ReactNode;
    right: React.ReactNode;
    leftRatio?: number;
    rightRatio?: number;
    gap?: number;
}

export function PdfGridTwoColumn({
    left,
    right,
    leftRatio = REPORT_LAYOUT.grid.mainRatio.left,
    rightRatio = REPORT_LAYOUT.grid.mainRatio.right,
    gap = REPORT_LAYOUT.grid.gap,
}: PdfGridTwoColumnProps) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `${leftRatio}fr ${rightRatio}fr`,
                gap: `${gap}px`,
                height: "100%",
                width: "100%",
                overflow: "hidden",
            }}
        >
            <div style={{ overflow: "hidden", height: "100%" }} className="min-h-0">{left}</div>
            <div style={{ overflow: "hidden", height: "100%" }} className="min-h-0">{right}</div>
        </div>
    );
}

/**
 * FIXED CHART WRAPPER
 * Uses chart-print-lock class from globals.css to force SVG/Canvas sizing.
 */
interface FixedChartWrapperProps {
    width?: number | string;
    height?: number | string;
    maxWidth?: number | string;
    children: React.ReactNode;
}

export function FixedChartWrapper({
    width = "100%",
    height = REPORT_LAYOUT.chart.large,
    maxWidth = "none",
    children,
}: FixedChartWrapperProps) {
    return (
        <div
            className="chart-print-lock"
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
                maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
                display: "block",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div style={{ width: "100%", height: "100%" }}>
                {children}
            </div>
        </div>
    );
}

/**
 * UTILITY: CHUNK DATA
 */
export function chunkRows<T>(rows: T[], size: number = REPORT_LAYOUT.appendix.cardsPerPage): T[][] {
    const chunks: T[][] = [];
    if (!rows) return chunks;
    for (let i = 0; i < rows.length; i += size) {
        chunks.push(rows.slice(i, i + size));
    }
    return chunks;
}
