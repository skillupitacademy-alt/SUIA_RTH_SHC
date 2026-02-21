import React from 'react';
import { Info } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MethodologyDisclaimerProps {
    text: string;
    className?: string;
}

export const MethodologyDisclaimer = ({ text, className }: MethodologyDisclaimerProps) => {
    return (
        <div className={cn("mt-6 pt-4 border-t border-white/5 flex items-start gap-3 group/methodology", className)}>
            <Info size={12} className="text-slate-500 shrink-0 mt-0.5 group-hover/methodology:text-indigo-400 transition-colors" />
            <p className="text-[10px] font-medium leading-relaxed text-slate-500 uppercase tracking-wider group-hover/methodology:text-slate-400 transition-colors">
                <span className="font-black text-slate-600 mr-1 opacity-70 group-hover/methodology:text-indigo-500/70">METHODOLOGY:</span>
                {text}
            </p>
        </div>
    );
};
