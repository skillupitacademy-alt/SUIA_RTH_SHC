import React from 'react';
import { Info } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MethodologyDisclaimerProps {
    text: string;
    className?: string;
}

export const MethodologyDisclaimer = ({ text, className }: MethodologyDisclaimerProps) => {
    return (
        <div className={cn("flex items-start gap-3 group/methodology", className)}>
            <Info size={12} className="text-slate-500 shrink-0 mt-0.5 group-hover/methodology:text-indigo-400 transition-colors" />
            <p className="text-[10px] font-medium leading-relaxed text-slate-500 uppercase tracking-wider group-hover/methodology:text-slate-400 transition-colors">
                {text}
            </p>
        </div>
    );
};
