'use client';

import { cn } from "./lib/utils";

interface ZSkeletonProps {
    className?: string;
    variant?: "rectangle" | "circle" | "line";
    width?: string | number;
    height?: string | number;
}

/**
 * ZSkeleton - Modern layout placeholder to prevent Cumulative Layout Shift (CLS).
 * Features a subtle pulse animation with brand highlight (#FF2D55).
 */
export function ZSkeleton({
    className,
    variant = "rectangle",
    width,
    height
}: ZSkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-gray-200/60 relative overflow-hidden",
                variant === "circle" && "rounded-full",
                variant === "rectangle" && "rounded-lg",
                variant === "line" && "rounded-sm h-4 w-full",
                className
            )}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
            }}
        >
            {/* Subtle brand color highlight overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundColor: '#FF2D55' }}
            />
        </div>
    );
}
