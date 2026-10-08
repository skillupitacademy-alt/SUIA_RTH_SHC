"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ReportTheme = "dark" | "light";

interface ReportThemeContextValue {
    theme: ReportTheme;
    toggleTheme: () => void;
    setTheme: (t: ReportTheme) => void;
}

const ReportThemeContext = createContext<ReportThemeContextValue>({
    theme: "dark",
    toggleTheme: () => {},
    setTheme: () => {},
});

export function ReportThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ReportTheme>("dark");

    useEffect(() => {
        // Persist preference in localStorage
        const saved = localStorage.getItem("report-theme") as ReportTheme | null;
        if (saved === "light" || saved === "dark") {
            setThemeState(saved);
        }
    }, []);

    const setTheme = (t: ReportTheme) => {
        setThemeState(t);
        localStorage.setItem("report-theme", t);
        // Expose to Puppeteer via window for PDF capture
        (window as unknown as { __REPORT_THEME__?: string }).__REPORT_THEME__ = t;
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    // Sync to window on every change for Puppeteer
    useEffect(() => {
        (window as unknown as { __REPORT_THEME__?: string }).__REPORT_THEME__ = theme;
    }, [theme]);

    return (
        <ReportThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ReportThemeContext.Provider>
    );
}

export function useReportTheme() {
    return useContext(ReportThemeContext);
}
