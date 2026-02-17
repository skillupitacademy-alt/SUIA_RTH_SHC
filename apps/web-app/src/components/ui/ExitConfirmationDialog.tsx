'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExitConfirmationDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
}

export function ExitConfirmationDialog({
    isOpen,
    onConfirm,
    onCancel,
    title = "Leave this page?",
    message = "You have unsaved progress. Are you sure you want to leave?"
}: ExitConfirmationDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Focus trap and escape key handling
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-dialog-title"
        >
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
                aria-label="Close exit dialog"
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                className={cn(
                    "relative z-10 w-full max-w-md mx-4",
                    "bg-white/95 backdrop-blur-xl",
                    "rounded-[2rem] shadow-2xl shadow-primary/20",
                    "border border-white/20",
                    "p-8 space-y-6",
                    "animate-in fade-in zoom-in-95 duration-200"
                )}
            >
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/20 transition-colors text-muted-foreground"
                    aria-label="Close dialog"
                >
                    <X size={18} />
                </button>

                {/* Icon */}
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-2">
                    <h2
                        id="exit-dialog-title"
                        className="text-xl font-black tracking-tight uppercase"
                    >
                        {title}
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className={cn(
                            "flex-1 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest",
                            "bg-muted/20 hover:bg-muted/40 transition-all",
                            "text-foreground"
                        )}
                    >
                        Stay
                    </button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "flex-1 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest",
                            "bg-primary text-white",
                            "hover:scale-105 transition-all",
                            "shadow-lg shadow-primary/30"
                        )}
                    >
                        Leave
                    </button>
                </div>
            </div>
        </div>
    );
}
