'use client';

import { Activity } from 'lucide-react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { SystemAuditTerminal } from '@/components/dashboard/SystemAuditTerminal';

export default function AuditPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="System Audit Trail"
                description="Real-time stream of administrative actions and system events."
                icon={<Activity className="text-emerald-500" size={20} />}
            />

            <div className="p-2">
                <SystemAuditTerminal />
            </div>
        </div>
    );
}
