'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect,useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export interface ZTooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    delay?: number;
    followCursor?: boolean;
}

export function ZTooltip({ content, children, side = 'bottom', className, delay = 200, followCursor = true }: ZTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    const updatePosition = () => {
        if (followCursor) return; // Skip static calculation if following cursor
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

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (followCursor) {
            setCoords({ top: e.clientY, left: e.clientX });
        } else {
            updatePosition();
        }

        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!followCursor) return;
        setCoords({ top: e.clientY, left: e.clientX });
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible && !followCursor) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible, followCursor]);

    // Calculate dynamic offsets for cursor mode
    const cursorOffset = 16;
    const getTransform = () => {
        if (followCursor) {
            // Cursor mode: simple offset from pointer
            if (side === 'top') return `translate(-50%, -${100 + cursorOffset}%)`;
            if (side === 'bottom') return `translate(-50%, ${cursorOffset}px)`;
            if (side === 'left') return `translate(calc(-100% - ${cursorOffset}px), -50%)`;
            if (side === 'right') return `translate(${cursorOffset}px, -50%)`;
            return `translate(-50%, ${cursorOffset}px)`; // Default bottom
        }

        // Static mode: boundary based
        return side === 'top' ? 'translate(-50%, -100%)' :
            side === 'bottom' ? 'translate(-50%, 0)' :
                side === 'left' ? 'translate(-100%, -50%)' :
                    'translate(0, -50%)';
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={cn("contents", className)}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: getTransform()
                    }}
                >
                    <div className="bg-[#1A1A1A] text-slate-200 text-[10px] font-semibold px-3 py-2 rounded-lg shadow-xl border border-white/10 whitespace-nowrap backdrop-blur-md relative">
                        {content}
                        {!followCursor && (
                            <div className={cn(
                                "absolute w-2 h-2 bg-[#1A1A1A] border-white/5 rotate-45",
                                side === 'top' && "-bottom-1 left-1/2 -translate-x-1/2 border-r border-b",
                                side === 'bottom' && "-top-1 left-1/2 -translate-x-1/2 border-l border-t",
                                side === 'left' && "-right-1 top-1/2 -translate-y-1/2 border-r border-t",
                                side === 'right' && "-left-1 top-1/2 -translate-y-1/2 border-l border-b"
                            )} />
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
