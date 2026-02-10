import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { WebSessionWatcherContainer } from "@/components/auth/WebSessionWatcherContainer";
import { SessionExpiryModal } from "@/components/auth/SessionExpiryModal";
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
                        <SessionExpiryModal />
                        <WebSessionWatcherContainer />
                        <AppShell>
                            {children}
                        </AppShell>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
