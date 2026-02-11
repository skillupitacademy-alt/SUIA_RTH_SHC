"use client"

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./alert-dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ZConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ZConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'info'
}: ZConfirmationDialogProps) {

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertCircle className="text-rose-500" size={24} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
            default: return <Info className="text-blue-500" size={24} />;
        }
    };

    const getButtonClass = () => {
        switch (variant) {
            case 'danger': return "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20";
            case 'warning': return "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20";
            default: return "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20";
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="rounded-[2.5rem] p-10 border-slate-200 shadow-2xl max-w-md animate-in zoom-in-95 duration-300">
                <AlertDialogHeader className="flex flex-col items-center text-center gap-4">
                    <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center mb-2",
                        variant === 'danger' ? "bg-rose-50" : variant === 'warning' ? "bg-amber-50" : "bg-blue-50"
                    )}>
                        {getIcon()}
                    </div>
                    <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-slate-400 font-medium leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <AlertDialogCancel
                        onClick={onClose}
                        className="flex-1 px-8 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all active:scale-95"
                    >
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95",
                            getButtonClass()
                        )}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
