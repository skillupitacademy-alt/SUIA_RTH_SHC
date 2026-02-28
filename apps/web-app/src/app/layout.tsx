import type { Metadata } from "next";
import "./globals.css";
import { SecurityMuzzle } from "@/components/auth/SecurityMuzzle";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
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
                    <ErrorBoundary>
                        <ThemeProvider>
                            <SecurityMuzzle />
                            <GlobalNavigationLoader />
                            {children}
                            <Analytics />
                            <div id="modal-root" />
                        </ThemeProvider>
                    </ErrorBoundary>
                </MonitoringProvider>
            </body>
        </html>
    );
}
