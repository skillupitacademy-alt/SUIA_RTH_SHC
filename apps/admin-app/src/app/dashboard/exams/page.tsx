'use client';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ExamActivityBoard } from '@/components/dashboard/ExamActivityBoard';
import { FileText } from 'lucide-react';

export default function ExamActivityPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="Exam Intelligence"
                description="Lifecycle analytics for assessments: Starts, Completions, and Abandonment."
                icon={<FileText className="text-amber-500" size={20} />}
            />

            <div className="p-2">
                <ExamActivityBoard />
            </div>
        </div>
    );
}
