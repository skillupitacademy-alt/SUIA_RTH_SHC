"use client";

import { useEffect, useState } from "react";

/**
 * PdfReadySignal - Emits a signal for Puppeteer to capture the PDF.
 * Includes "Modal Scrub" defense to hide any UI noise (modals, backdrops)
 * that might have accidentally triggered during the render cycle.
 */
export function PdfReadySignal() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // 1. Proactive Modal Scrub
        const scrubUi = () => {
            const selectors = [
                ".modal",
                "[data-modal]",
                ".backdrop",
                ".overlay",
                "[id*='session-expired']",
                "nav",
                "header:not(.pdf-header)"
            ];

            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    if (el instanceof HTMLElement) {
                        el.style.display = "none";
                        el.style.visibility = "hidden";
                        el.style.opacity = "0";
                    }
                });
            });

            // 2. Lock Layout
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
        };

        // Give time for hydration and chart rendering
        const timer = setTimeout(async () => {
            scrubUi();

            // 3. Layout Settle Timeout
            await new Promise(r => setTimeout(r, 200));

            setReady(true);
        }, 3000); // 3s total wait for stability

        return () => clearTimeout(timer);
    }, []);

    if (!ready) return null;

    return (
        <div
            id="pdf-ready-signal"
            data-pdf-ready="true"
            className="hidden"
        />
    );
}
