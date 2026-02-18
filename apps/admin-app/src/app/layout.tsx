import "./globals.css";

import type { Metadata } from "next";

import { SecurityMuzzle } from "@/components/auth/SecurityMuzzle";
import { FetchCredentialsProvider } from "@/components/providers/FetchCredentialsProvider";
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
                <ThemeProvider>
                    <FetchCredentialsProvider />
                    <SecurityMuzzle />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
