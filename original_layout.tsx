import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { SecurityMuzzle } from "@/components/auth/SecurityMuzzle";
import { ZErrorBoundary } from "@quiz/ui";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { GlobalNavigationLoader } from "@/components/layout/GlobalNavigationLoader";
import { MonitoringProvider } from "@/components/providers/MonitoringProvider";

export const metadata: Metadata = {
    title: "Quiz Platform",
    description: "Learn and Test your knowledge",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <MonitoringProvider>
                    <ZErrorBoundary appId="web-app" sessionIdKey="quiz_session_id" recoveryMode="reload">
                        <ThemeProvider>
                            <SecurityMuzzle />
                            <GlobalNavigationLoader />
                            {children}
                            <Analytics />
                            <div id="modal-root" />
                        </ThemeProvider>
                    </ZErrorBoundary>
                </MonitoringProvider>
            </body>
        </html>
    );
}
