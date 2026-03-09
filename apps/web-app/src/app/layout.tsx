import React from "react";
import ReactDOM from "react-dom";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

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
import { ZErrorBoundary } from "@quiz/ui";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { GlobalNavigationLoader } from "@/components/layout/GlobalNavigationLoader";
import { MonitoringProvider } from "@/components/providers/MonitoringProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
    title: "Quiz Platform",
    description: "Learn and Test your knowledge",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    ReactDOM.preconnect("https://fonts.googleapis.com");
    ReactDOM.preconnect("https://fonts.gstatic.com", { crossOrigin: "" });
    ReactDOM.preconnect(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002", { crossOrigin: "use-credentials" });

    return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
            <body>
                <MonitoringProvider>
                    <ZErrorBoundary appId="web-app" sessionIdKey="quiz_session_id" recoveryMode="reload">
                        <ThemeProvider>
                            <QueryProvider>
                                <SecurityMuzzle />
                                <GlobalNavigationLoader />
                                {children}
                                <Analytics />
                                <div id="modal-root" />
                            </QueryProvider>
                        </ThemeProvider>
                    </ZErrorBoundary>
                </MonitoringProvider>
            </body>
        </html>
    );
}
