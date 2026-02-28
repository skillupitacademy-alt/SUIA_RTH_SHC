import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";

import { SecurityMuzzle } from "@/components/auth/SecurityMuzzle";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
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
                    <ErrorBoundary>
                        <ThemeProvider>
                            <FetchCredentialsProvider />
                            <SecurityMuzzle />
                            {children}
                            <Analytics />
                        </ThemeProvider>
                    </ErrorBoundary>
                </MonitoringProvider>
            </body>
        </html>
    );
}
