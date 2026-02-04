'use client';

import { cn } from '@/lib/utils';

interface TopicChipProps {
    id: string;
    name: string;
    selectedCount: number;
    totalCount: number;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

export function TopicChip({
    id,
    name,
    selectedCount,
    totalCount,
    isSelected,
    onToggle
}: TopicChipProps) {
    return (
        <button
            onClick={() => onToggle(id)}
            className={cn(
                "flex flex-col items-start justify-center px-5 py-3 rounded-xl transition-all duration-300 min-w-[160px] text-left",
                isSelected
                    ? "bg-[#FF2D55] text-white shadow-[0_0_20px_rgba(255,45,85,0.4)] scale-[1.05] z-10"
                    : "bg-[#2D2D2D] text-white/90 hover:bg-[#3D3D3D] hover:scale-[1.02]"
            )}
        >
            <span className="text-sm font-bold font-inter leading-none mb-1">{name}</span>
            <span className={cn(
                "text-[10px] font-medium opacity-60 uppercase tracking-wider",
                isSelected ? "text-white/80" : "text-white/50"
            )}>
                ({selectedCount}/{totalCount} selected)
            </span>
        </button>
    );
}
