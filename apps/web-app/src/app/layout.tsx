import type { Metadata } from "next";
import "./globals.css";
import { SecurityMuzzle } from "@/components/auth/SecurityMuzzle";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

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
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
