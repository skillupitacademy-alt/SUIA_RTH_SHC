"use client";

/**
 * REPORT LAYOUT TOKENS
 * Single source of truth for Web ⇄ PDF design parity.
 * Both ExamReportLayout.tsx and PrintPages.tsx consume these tokens
 * so layout changes propagate to both surfaces automatically.
 */
export const REPORT_LAYOUT = {
    page: {
        landscape: { width: 1920, height: 1080, padding: 32 },
        portrait: { width: 1080, height: 1920, padding: 32 },
    },

    chart: {
        /** Full-page hero chart (RadialKPI, SubtopicBar) */
        large: 520,
        /** Mid-size chart (SkillDonut, TimeDonut) */
        medium: 320,
    },

    card: {
        /** Right-rail tactical panel minimum height */
        tactical: 440,
        /** Bottom interpretation band height */
        interpretation: 140,
        /** Complexity ladder chart area */
        complexity: 400,
    },

    grid: {
        /** Balanced columns to prevent clipping on 1920px canvas */
        mainRatio: { left: 1, right: 1 },
        /** Standard gap between grid columns */
        gap: 32,
        /** Gap between stacked sections */
        sectionGap: 24,
    },

    appendix: {
        /** Cards per landscape page */
        cardsPerPage: 5,
    },

    radius: {
        card: "rounded-3xl",
        pill: "rounded-2xl",
    },

    typography: {
        /** Page section heading */
        heading: "text-lg font-black uppercase tracking-tighter text-white",
        /** Small label / metadata */
        label: "text-[10px] font-black uppercase tracking-widest text-slate-600",
        /** Body / paragraph */
        body: "text-xs text-slate-400 leading-relaxed font-medium",
        /** Large numeric display */
        metric: "text-2xl font-black text-white tracking-tighter tabular-nums",
    },
} as const;
