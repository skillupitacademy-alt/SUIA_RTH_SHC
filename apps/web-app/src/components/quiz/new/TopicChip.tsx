'use client';

import { cn } from '@/lib/utils';

interface TopicChipProps {
    id: string;
    name: string;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

export function TopicChip({
    id,
    name,
    isSelected,
    onToggle
}: TopicChipProps) {
    return (
        <button
            onClick={() => onToggle(id)}
            className={cn(
                "flex items-center justify-center text-center px-6 py-4 rounded-2xl transition-all duration-300 w-[220px] h-[80px]",
                isSelected
                    ? "bg-[#FF2D55] text-white shadow-[0_15px_35px_rgba(255,45,85,0.4)] scale-[1.05] z-10"
                    : "bg-[#2D2D2D] text-white/90 hover:bg-[#3D3D3D] hover:scale-[1.02]"
            )}
        >
            <span className="text-sm font-bold font-inter leading-tight uppercase tracking-wide">{name}</span>
        </button>
    );
}
