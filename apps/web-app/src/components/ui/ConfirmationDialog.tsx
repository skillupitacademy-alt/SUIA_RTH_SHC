'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationDialog({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'info'
}: ConfirmationDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />;
            case 'warning': return <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />;
            default: return <Info className="h-8 w-8 text-blue-600 dark:text-blue-400" />;
        }
    };

    const getIconBg = () => {
        switch (variant) {
            case 'danger': return "bg-rose-100 dark:bg-rose-900/30";
            case 'warning': return "bg-amber-100 dark:bg-amber-900/30";
            default: return "bg-blue-100 dark:bg-blue-900/30";
        }
    };

    const getBtnColor = () => {
        switch (variant) {
            case 'danger': return "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30";
            case 'warning': return "bg-amber-600 hover:bg-amber-700 shadow-amber-500/30";
            default: return "bg-primary hover:bg-primary/90 shadow-primary/30";
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div
                ref={dialogRef}
                className={cn(
                    "relative z-10 w-full max-w-md",
                    "bg-white dark:bg-zinc-900",
                    "rounded-[2.5rem] shadow-2xl p-10 space-y-8",
                    "border border-white/20 animate-in zoom-in-95 duration-300"
                )}
            >
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className={cn("h-20 w-20 rounded-[2rem] flex items-center justify-center", getIconBg())}>
                        {getIcon()}
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight uppercase italic">{title}</h2>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">{message}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-8 py-4 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] hover:bg-muted/10 transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white transition-all active:scale-95 shadow-xl",
                            getBtnColor()
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
