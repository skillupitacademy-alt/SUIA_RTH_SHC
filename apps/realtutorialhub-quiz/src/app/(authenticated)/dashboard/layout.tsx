'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-[calc(100vh-64px)] w-full max-w-full overflow-x-hidden bg-muted/5">
            <Sidebar />
            <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto p-6 pb-24 md:ml-64 md:p-10 md:pb-10">
                {children}
            </main>
            <MobileNav />
        </div>
    );
}