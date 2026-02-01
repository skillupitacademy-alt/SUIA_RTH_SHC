'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ZTooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    delay?: number;
}

export function ZTooltip({ content, children, side = 'top', className, delay = 200 }: ZTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let top = 0;
            let left = 0;
            const offset = 10;

            switch (side) {
                case 'top':
                    top = rect.top - offset;
                    left = rect.left + rect.width / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + offset;
                    left = rect.left + rect.width / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2;
                    left = rect.left - offset;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2;
                    left = rect.right + offset;
                    break;
            }
            setCoords({ top, left });
        }
    };

    const handleMouseEnter = () => {
        updatePosition();
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible]);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={cn("contents", className)} // 'contents' allows the child to be layout parent
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: side === 'top' ? 'translate(-50%, -100%)' :
                            side === 'bottom' ? 'translate(-50%, 0)' :
                                side === 'left' ? 'translate(-100%, -50%)' :
                                    'translate(0, -50%)'
                    }}
                >
                    <div className="bg-[#1A1A1A] text-slate-200 text-[10px] font-semibold px-4 py-2.5 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/5 max-w-[240px] text-center leading-relaxed tracking-wide backdrop-blur-xl relative">
                        {content}
                        {/* Arrow */}
                        <div className={cn(
                            "absolute w-2 h-2 bg-[#1A1A1A] border-white/5 rotate-45",
                            side === 'top' && "-bottom-1 left-1/2 -translate-x-1/2 border-r border-b",
                            side === 'bottom' && "-top-1 left-1/2 -translate-x-1/2 border-l border-t",
                            side === 'left' && "-right-1 top-1/2 -translate-y-1/2 border-r border-t",
                            side === 'right' && "-left-1 top-1/2 -translate-y-1/2 border-l border-b"
                        )} />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
