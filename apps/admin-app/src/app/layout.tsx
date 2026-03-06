import "./globals.css";

import { ZErrorBoundary } from "@quiz/ui";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import React from "react";

import { SecurityMuzzle } from "@/components/auth/SecurityMuzzle";
import { FetchCredentialsProvider } from "@/components/providers/FetchCredentialsProvider";
import { MonitoringProvider } from "@/components/providers/MonitoringProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
    title: "QuizAdmin | Governance",
    description: "Enterprise Quiz Platform Admin Terminal",
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
                    <ZErrorBoundary appId="admin-app" sessionIdKey="admin_session_id" recoveryMode="both">
                        <ThemeProvider>
                            <FetchCredentialsProvider />
                            <SecurityMuzzle />
                            {children}
                            <Analytics />
                        </ThemeProvider>
                    </ZErrorBoundary>
                </MonitoringProvider>
            </body>
        </html>
    );
}
