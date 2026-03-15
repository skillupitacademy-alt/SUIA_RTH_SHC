"use client";

import { Sun, Moon } from "lucide-react";
import { useReportTheme } from "../context/ReportThemeContext";
import { cn } from "@/lib/utils";

export function ReportThemeToggle({ className }: { className?: string }) {
    const { theme, toggleTheme } = useReportTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "no-print flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200",
                theme === "dark"
                    ? "bg-slate-900/50 border-white/10 text-slate-300 hover:border-white/20 hover:text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary",
                className
            )}
            aria-label="Toggle report theme"
        >
            {theme === "dark" ? (
                <Sun size={14} className="text-amber-400" />
            ) : (
                <Moon size={14} className="text-indigo-500" />
            )}
            <span className="text-[11px] font-black uppercase tracking-widest">
                {theme === "dark" ? "Light" : "Dark"}
            </span>
        </button>
    );
}
