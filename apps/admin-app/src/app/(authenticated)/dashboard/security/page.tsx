'use client';

import { ShieldAlert } from 'lucide-react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { SecurityHealthPanel } from '@/components/dashboard/SecurityHealthPanel';

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="Security Protocol"
                description="Monitor system threats, authentication attempts, and firewall status."
                icon={<ShieldAlert className="text-rose-500" size={20} />}
            />

            <div className="p-2">
                <SecurityHealthPanel />
            </div>
        </div>
    );
}
