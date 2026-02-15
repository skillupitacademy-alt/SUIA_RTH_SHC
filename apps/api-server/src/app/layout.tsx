import './index.css';

import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

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
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
            <body>
                <AppAuthWrapper>
                    <div className="grid-bg" />
                    {children}
                </AppAuthWrapper>
            </body>
        </html>
    );
}
