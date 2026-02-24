"use client";

import { useEffect, useState } from "react";

/**
 * PdfReadySignal - Emits a signal for Puppeteer to capture the PDF.
 * Includes "Modal Scrub" defense, Font Readiness, and Paint Buffer
 * to ensure all charts and typography are fully resolved before capture.
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

        // Give time for hydration + chart rendering + font loading
        const timer = setTimeout(async () => {
            scrubUi();

            // 3. Wait for all fonts to be fully loaded and rendered
            try {
                const fontsReady = (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
                if (fontsReady) {
                    await fontsReady;
                }
            } catch {
                // Fallback: fonts.ready not available, proceed anyway
            }

            // 4. Paint Buffer — let charts + SVGs complete their final paint cycle
            await new Promise(r => setTimeout(r, 1200));

            setReady(true);
        }, 4000); // 4s total wait for chart hydration + render stability

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
