import type { Metadata } from "next";
import "./globals.css";
import { SecurityMuzzle } from "@/components/auth/SecurityMuzzle";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GlobalNavigationLoader } from "@/components/layout/GlobalNavigationLoader";

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
                    <SecurityMuzzle />
                    <GlobalNavigationLoader />
                    {children}
                    <div id="modal-root" />
                </ThemeProvider>
            </body>
        </html>
    );
}
