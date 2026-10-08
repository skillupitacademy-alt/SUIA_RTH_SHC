'use client';

import { cn } from '@/lib/utils';

interface PageTitleProps {
    text: string;
    className?: string;
    uppercase?: boolean;
}

/**
 * Renders a heading with alternating accent color:
 * word1 = black, word2 = pink, word3 = black, then repeat.
 * Size is fixed to text-4xl as requested for cross-page consistency.
 */
export function PageTitle({ text, className, uppercase = true }: PageTitleProps) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return (
        <h1
            className={cn(
                'text-4xl font-outfit font-black tracking-tighter leading-tight flex flex-wrap gap-2',
                uppercase ? 'uppercase' : '',
                className
            )}
        >
            {words.map((word, idx) => {
                const isAccent = idx % 2 === 1; // 2nd, 4th, ...
                return (
                    <span
                        key={`${word}-${idx}`}
                        className={isAccent ? 'text-[#FF4B91]' : 'text-[#1A1A1A]'}
                    >
                        {word}
                    </span>
                );
            })}
        </h1>
    );
}
