"use client";
import { useReportTheme } from "../context/ReportThemeContext";
import { getThemeTokens } from "../context/reportThemeTokens";

export function useReportThemeTokens() {
    const { theme } = useReportTheme();
    return { tokens: getThemeTokens(theme), theme };
}
