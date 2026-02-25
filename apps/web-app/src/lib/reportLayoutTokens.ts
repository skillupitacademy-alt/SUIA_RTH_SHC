"use client";

/**
 * REPORT LAYOUT TOKENS
 * Single source of truth for Web ⇄ PDF design parity.
 * Both ExamReportLayout.tsx and PrintPages.tsx consume these tokens
 * so layout changes propagate to both surfaces automatically.
 */
export const REPORT_LAYOUT = {
    page: {
        landscape: { width: 1440, height: 1024, padding: 32 },
        portrait: { width: 1024, height: 1440, padding: 32 },
    },

    chart: {
        /** Full-page hero chart (RadialKPI, SubtopicBar) */
        large: 720,
        /** Mid-size chart (SkillDonut, TimeDonut) */
        medium: 280,
    },

    card: {
        /** Right-rail tactical panel minimum height */
        tactical: 420,
        /** Bottom interpretation band height */
        interpretation: 140,
        /** Complexity ladder chart area */
        complexity: 360,
    },

    grid: {
        /** Primary two-column: chart (wide) + panel (narrow) */
        mainRatio: { left: 1.65, right: 1 },
        /** Standard gap between grid columns */
        gap: 48,
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
        heading: "text-xl font-black uppercase tracking-tighter text-white",
        /** Small label / metadata */
        label: "text-[10px] font-black uppercase tracking-widest text-slate-600",
        /** Body / paragraph */
        body: "text-xs text-slate-400 leading-relaxed font-medium",
        /** Large numeric display */
        metric: "text-5xl font-black text-white tracking-tighter tabular-nums",
    },
} as const;
