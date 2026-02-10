'use client';

import { Activity } from 'lucide-react';

interface ZLoaderProps {
    className?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    text?: string;
    center?: boolean;
    color?: string;
}

const sizes = {
    xs: "w-3 h-3",
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
};

/**
 * ZLoader - The authoritative loading indicator for the platform.
 * Unified to use the spinning Activity icon at a smaller scale.
 */
export function ZLoader({ className, size = "md", text, center = true, color }: ZLoaderProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${center ? "mx-auto" : ""} ${className || ""}`}>
            <div className="relative">
                <Activity
                    className={`animate-spin ${sizes[size]}`}
                    style={color ? { color } : undefined}
                />
            </div>
            {text && (
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A] animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}
