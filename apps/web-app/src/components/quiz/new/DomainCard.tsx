'use client';

import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DomainCardProps {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: LucideIcon;
    coverage: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
    accentColor: string; // Tailwind color class or hex
}

export function DomainCard({
    id,
    name,
    description,
    category,
    icon: Icon,
    coverage,
    isSelected,
    onSelect,
    accentColor = 'blue'
}: DomainCardProps) {

    // Map of colors for the icons/bars
    const colorMap: Record<string, string> = {
        blue: 'text-blue-500 bg-blue-50',
        purple: 'text-purple-500 bg-purple-50',
        green: 'text-green-500 bg-green-50',
        orange: 'text-orange-500 bg-orange-50',
    };

    const barColorMap: Record<string, string> = {
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        green: 'bg-green-500',
        orange: 'bg-orange-500',
    };

    return (
        <button
            onClick={() => onSelect(id)}
            className={cn(
                "relative bg-white rounded-[1.5rem] p-6 text-left transition-all duration-500 border-2 group outline-none h-[210px] flex flex-col",
                isSelected
                    ? "border-[#FF2D55] shadow-[0_10px_30px_rgba(255,45,85,0.15)] scale-[1.02] z-10"
                    : "border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:scale-[1.01]"
            )}
        >
            {/* Top Row: Icon and Checkmark */}
            <div className="flex justify-between items-start mb-4 flex-none">
                <div className={cn(
                    "p-3 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3",
                    colorMap[accentColor] || colorMap.blue
                )}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>

                <div className="flex flex-col items-end gap-2">
                    {isSelected && (
                        <div className="bg-[#FF2D55] text-white p-1 rounded-md animate-in zoom-in duration-300">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    )}
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500 uppercase tracking-tighter">
                        {category}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
                <h3 className="text-lg font-bold font-inter text-[#1A1A1A] mb-1 leading-tight">{name}</h3>
                <p className="text-xs text-muted-foreground font-inter mb-4 line-clamp-2 leading-relaxed flex-1">
                    {description}
                </p>

                {/* Bottom Row: Progress Bar */}
                <div className="space-y-2 mt-auto">
                    <div className="h-1.5 w-full bg-[#E5E7EB]/50 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-1000 ease-out", barColorMap[accentColor] || barColorMap.blue)}
                            style={{ width: `${coverage}%` }}
                        />
                    </div>
                    <p className="text-[10px] font-bold font-inter text-muted-foreground uppercase tracking-wider">
                        {coverage}% coverage
                    </p>
                </div>
            </div>

            {/* Active Glow Overlay - Refined for Internal Containment */}
            {isSelected && (
                <div className="absolute inset-0 rounded-[1.5rem] ring-2 ring-[#FF2D55]/50 ring-inset pointer-events-none shadow-[inset_0_0_20px_rgba(255,45,85,0.1)]" />
            )}
        </button>
    );
}
