'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-[calc(100vh-64px)] bg-muted/5">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-6 md:p-10 pb-24 md:pb-10 overflow-y-auto">
                {children}
            </main>
            <MobileNav />
        </div>
    );
}
