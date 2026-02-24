"use client";

import React from "react";

/**
 * PDF PAGE MODEL (A4 Landscape @ 96dpi)
 * Dimensions: 1123px x 794px
 */
interface PdfPageProps {
    children: React.ReactNode;
    orientation?: "landscape" | "portrait";
}

export function PdfPage({ children, orientation = "landscape" }: PdfPageProps) {
    const isLandscape = orientation === "landscape";
    return (
        <div
            className={`pdf-page ${orientation} relative flex flex-col bg-[#0B1220] text-slate-100 overflow-hidden select-none`}
            style={{
                width: isLandscape ? 1123 : 794,
                height: isLandscape ? 794 : 1123,
                padding: "40px",
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
    leftRatio = 2,
    rightRatio = 1,
    gap = 32
}: PdfGridTwoColumnProps) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `${leftRatio}fr ${rightRatio}fr`,
                gap: `${gap}px`,
                height: "100%",
                width: "100%",
                overflow: "hidden"
            }}
        >
            <div style={{ overflow: "hidden", height: "100%" }}>{left}</div>
            <div style={{ overflow: "hidden", height: "100%" }}>{right}</div>
        </div>
    );
}

/**
 * FIXED CHART WRAPPER
 * Locks dimensions to prevent Recharts/ECharts from resizing during capture.
 */
interface FixedChartWrapperProps {
    width?: number | string;
    height?: number | string;
    children: React.ReactNode;
}

export function FixedChartWrapper({
    width = "100%",
    height = 420,
    children
}: FixedChartWrapperProps) {
    return (
        <div
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
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
export function chunkRows<T>(rows: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < rows.length; i += size) {
        chunks.push(rows.slice(i, i + size));
    }
    return chunks;
}
