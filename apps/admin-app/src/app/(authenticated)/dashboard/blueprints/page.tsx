'use client';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { BlueprintAuditBoard } from '@/components/dashboard/BlueprintAuditBoard';
import { GitBranch } from 'lucide-react';

export default function BlueprintAuditPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="Blueprint Integrity"
                description="Verify assessment configurations, question distribution, and compliance."
                icon={<GitBranch className="text-blue-500" size={20} />}
            />

            <div className="p-2">
                <BlueprintAuditBoard />
            </div>
        </div>
    );
}
