"use client";

import { useEffect, useState } from "react";

export function PdfReadySignal() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Give time for hydration and chart rendering
        const timer = setTimeout(() => {
            setReady(true);
        }, 2500); // 2.5s is sufficient for hydration + entry animations

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
