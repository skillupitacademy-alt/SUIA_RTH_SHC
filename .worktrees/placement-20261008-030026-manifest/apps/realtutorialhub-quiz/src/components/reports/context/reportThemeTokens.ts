export const darkTokens = {
    // Page backgrounds
    // Match existing report/dashboard dark surface more closely
    pageBg: "#020617",
    cardBg: "#0d111a",
    cardBorder: "rgba(255,255,255,0.05)",
    cardHover: "rgba(15,23,42,0.55)",
    panelBg: "rgba(10,12,18,0.90)",
    primary: "#6366f1",
    
    // Text
    textPrimary: "#ffffff",
    textSecondary: "#94a3b8",
    textMuted: "#475569",
    textAccent: "#818cf8",
    
    // Chart surfaces
    chartBg: "#0d111a",
    chartGrid: "rgba(255,255,255,0.03)",
    chartAxis: "#64748b",
    
    // Borders
    borderSubtle: "rgba(255,255,255,0.05)",
    borderMedium: "rgba(148,163,184,0.12)",
    
    // Section header
    headerBorder: "rgba(30,41,59,0.60)",
} as const;

export const lightTokens = {
    // Page backgrounds
    pageBg: "#ffffff",
    cardBg: "#f8f9fc",
    cardBorder: "rgba(0,0,0,0.06)",
    cardHover: "rgba(241,245,249,0.75)",
    panelBg: "rgba(255,255,255,0.95)",
    primary: "hsl(337,90%,55%)",
    
    // Text
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    textAccent: "hsl(337,90%,55%)",  // brand primary pink
    
    // Chart surfaces
    chartBg: "#ffffff",
    chartGrid: "rgba(0,0,0,0.04)",
    chartAxis: "#94a3b8",
    
    // Borders
    borderSubtle: "rgba(0,0,0,0.06)",
    borderMedium: "rgba(0,0,0,0.10)",
    
    // Section header
    headerBorder: "rgba(226,232,240,0.80)",
} as const;

export interface ThemeTokens {
    readonly pageBg: string;
    readonly cardBg: string;
    readonly cardBorder: string;
    readonly cardHover: string;
    readonly panelBg: string;
    readonly primary: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
    readonly textMuted: string;
    readonly textAccent: string;
    readonly chartBg: string;
    readonly chartGrid: string;
    readonly chartAxis: string;
    readonly borderSubtle: string;
    readonly borderMedium: string;
    readonly headerBorder: string;
}

export function getThemeTokens(theme: "dark" | "light"): ThemeTokens {
    return theme === "dark" ? darkTokens : lightTokens;
}
