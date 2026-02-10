import './index.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Node | Quiz Platform',
  description: 'High-performance backend infrastructure for the modern quiz experience.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <div className="grid-bg" />
                {children}
            </body>
        </html>
    );
}
