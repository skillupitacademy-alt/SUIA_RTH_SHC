'use client';

import { FactoryProvider } from '@/context/FactoryContext';

export default function FactoryGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FactoryProvider>
            {children}
        </FactoryProvider>
    );
}
