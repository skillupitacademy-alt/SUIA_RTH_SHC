'use client';

import { cn } from '@/lib/utils';

interface TopicChipProps {
    id: string;
    name: string;
    description?: string;
    skillName?: string;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

export function TopicChip({
    id,
    name,
    description,
    skillName,
    isSelected,
    onToggle
}: TopicChipProps) {
    return (
        <button
            onClick={() => onToggle(id)}
            className={cn(
                "flex flex-col items-start justify-center p-6 rounded-[1.25rem] transition-all duration-300 w-full h-full text-left border-2 outline-none relative overflow-hidden",
                isSelected
                    ? "bg-[#FF2D55] text-white border-[#FF2D55] shadow-[0_10px_30px_rgba(255,45,85,0.4)] scale-[1.02] z-10"
                    : "bg-[#2D2D2D] text-white/90 border-transparent hover:border-[#FF2D55]/30 hover:bg-[#3D3D3D] hover:scale-[1.01]"
            )}
        >
            <div className="flex justify-between items-start w-full mb-3">
                <span className="text-base font-bold font-inter leading-tight">{name}</span>
                {skillName && (
                    <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                        isSelected ? "bg-white/20 text-white" : "bg-[#FF2D55]/10 text-[#FF2D55]"
                    )}>
                        {skillName}
                    </span>
                )}
            </div>

            {description && (
                <p className={cn(
                    "text-xs font-medium font-inter leading-relaxed line-clamp-2",
                    isSelected ? "text-white/80" : "text-white/40"
                )}>
                    {description}
                </p>
            )}
        </button>
    );
}
