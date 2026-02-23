"use client";

import { useEffect, useState } from "react";

export function PdfReadySignal() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Give time for hydration and chart rendering
        const timer = setTimeout(() => {
            setReady(true);
        }, 5000); // 5 seconds is usually enough for these charts

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
