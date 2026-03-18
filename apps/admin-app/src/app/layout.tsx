import "./globals.css";

import { ZErrorBoundary } from "@quiz/ui";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import React from "react";
import ReactDOM from "react-dom";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

import { SecurityMuzzle } from "@/components/auth/SecurityMuzzle";
import { FetchCredentialsProvider } from "@/components/providers/FetchCredentialsProvider";
import { MonitoringProvider } from "@/components/providers/MonitoringProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    ReactDOM.preconnect(apiUrl !== undefined && apiUrl !== null && apiUrl !== '' ? apiUrl : "https://api.realtutorialhub.com", { crossOrigin: "use-credentials" });

    return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
            <body>
                <MonitoringProvider>
                    <ZErrorBoundary appId="admin-app" sessionIdKey="admin_session_id" recoveryMode="both">
                        <ThemeProvider>
                            <QueryProvider>
                                <FetchCredentialsProvider />
                                <SecurityMuzzle />
                                {children}
                                <Analytics />
                            </QueryProvider>
                        </ThemeProvider>
                    </ZErrorBoundary>
                </MonitoringProvider>
            </body>
        </html>
    );
}
