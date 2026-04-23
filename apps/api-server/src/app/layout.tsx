import './index.css';

import type { Metadata } from 'next';

// Use system fonts to avoid Google Fonts fetch during build
const fontVariables = '--font-inter --font-outfit';

export const metadata: Metadata = {
    title: 'API Node | Quiz Platform',
    description: 'High-performance backend infrastructure for the modern quiz experience.',
};

import { AppAuthWrapper } from "@/components/auth/AppAuthWrapper";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AppAuthWrapper>
                    <div className="grid-bg" />
                    {children}
                </AppAuthWrapper>
            </body>
        </html>
    );
}
