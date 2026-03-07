'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useScrollLock } from './hooks/use-scroll-lock';

interface ZPortalModalProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose?: () => void;
    zIndex?: number;
    className?: string;
}

/**
 * ZPortalModal renders its children into a React Portal at document.body.
 * It automatically applies scroll locking to the background and ensures
 * full viewport coverage with a high z-index.
 */
export function ZPortalModal({
    children,
    isOpen,
    onClose,
    zIndex = 1000,
    className = "fixed inset-0 w-screen h-[100dvh] overflow-hidden flex flex-col bg-white"
}: ZPortalModalProps) {
    const [mounted, setMounted] = useState(false);

    // Apply scroll lock when open
    useScrollLock(isOpen);

    // Allow parent to close modal via Escape key when handler provided
    useEffect(() => {
        if (!isOpen || !onClose) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            className={className}
            style={{ zIndex }}
            aria-modal="true"
            role="dialog"
        >
            {children}
        </div>,
        document.body
    );
}
