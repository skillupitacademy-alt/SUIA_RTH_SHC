'use client';

import { cn } from "@/lib/utils";

interface ZLoaderProps {
    className?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    text?: string;
    center?: boolean;
}

const sizes = {
    xs: "w-4 h-4 border-2",
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
    xl: "w-24 h-24 border-8"
};

/**
 * ZLoader - The authoritative loading indicator for the platform.
 * Replaces Activity, Loader2, and ad-hoc CSS spinners.
 */
export function ZLoader({ className, size = "md", text, center = true }: ZLoaderProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-4",
            center && "mx-auto",
            className
        )}>
            <div className={cn(
                "rounded-full animate-spin border-4 border-slate-100 border-t-[#FF4B91]",
                sizes[size]
            )} />
            {text && (
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A] animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}
