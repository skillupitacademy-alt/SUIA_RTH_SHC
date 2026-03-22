"use client";

import { useEffect, useState } from "react";

/**
 * PdfReadySignal - Emits a signal for Puppeteer to capture the PDF.
 * Includes "Modal Scrub" defense, Font Readiness, and Paint Buffer
 * to ensure all charts and typography are fully resolved before capture.
 * Now gated by the deterministic Handshake with Recharts.
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

        // Helper to poll for full readiness (Charts + Heatmap + Complexity)
        const waitForReady = async (timeoutMs: number) => {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                const ok = window.__PDF_READY_IS_DONE__?.();
                if (ok) return true;
                await new Promise((r) => setTimeout(r, 100));
            }
            return false;
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

            // 4. Wait for Universal Readiness handshake
            // This ensures all Charts, Heatmaps, and Complexity bars have completed layout + paint.
            await waitForReady(10000); // 10s safety limit

            // 5. Final Paint Settle — 300ms for browser to resolve SVG layers
            await new Promise(r => setTimeout(r, 300));

            setReady(true);
        }, 1000); // Initial delay to allow components to mount

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
