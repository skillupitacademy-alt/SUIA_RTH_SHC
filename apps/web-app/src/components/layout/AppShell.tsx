'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';
import { GlobalSearchDialog } from '@/components/common/GlobalSearchDialog';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const isHome = pathname === '/';
    const isReportPage = pathname.startsWith('/reports/') && pathname !== '/reports/active-report';

    return (
        <div className="relative flex min-h-screen flex-col">
            <GlobalSearchDialog />
            {!isReportPage && <Header />}
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            {isHome && <Footer />}
        </div>
    );
}
