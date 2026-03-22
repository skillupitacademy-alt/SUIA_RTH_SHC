import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeProps = React.HTMLAttributes<HTMLDivElement>;

function Badge({ className, ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border border-slate-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                className
            )}
            {...props}
        />
    )
}

export { Badge }
