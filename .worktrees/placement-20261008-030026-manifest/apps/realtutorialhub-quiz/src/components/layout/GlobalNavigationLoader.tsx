"use client";

import React, { useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ZLoader } from "@quiz/ui";
import { motion, AnimatePresence } from "framer-motion";

/**
 * GlobalNavigationLoader
 * Provides immediate feedback on link clicks to improve perceived performance.
 * Uses the universal ZLoader for visual consistency.
 */
function LoaderContent() {
    const [isNavigating, setIsNavigating] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Reset loader when route changes
    useEffect(() => {
        setIsNavigating(false);
    }, [pathname, searchParams]);

    useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");

            if (anchor &&
                anchor.href &&
                anchor.href.startsWith(window.location.origin) &&
                !anchor.target &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.shiftKey &&
                !e.altKey &&
                anchor.getAttribute('href') !== '#' &&
                !anchor.href.includes('#')
            ) {
                // Determine if it's a real navigation or just a current page click
                const targetUrl = new URL(anchor.href);
                if (targetUrl.pathname !== window.location.pathname || targetUrl.search !== window.location.search) {
                    setIsNavigating(true);
                }
            }
        };

        window.addEventListener("click", handleAnchorClick);
        return () => window.removeEventListener("click", handleAnchorClick);
    }, []);

    return (
        <AnimatePresence>
            {isNavigating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md"
                >
                    <div className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-2xl flex flex-col items-center gap-6">
                        <ZLoader size="xl" text="Analyzing Neural Signals..." />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Synchronizing Destination</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function GlobalNavigationLoader() {
    return (
        <Suspense fallback={null}>
            <LoaderContent />
        </Suspense>
    );
}
