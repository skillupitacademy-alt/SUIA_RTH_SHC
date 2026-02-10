import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { SessionWatcher } from "@/components/auth/SessionWatcher";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";

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
                <ThemeProvider>
                    <AuthProvider>
                        <SessionWatcher />
                        <AppShell>
                            {children}
                        </AppShell>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
