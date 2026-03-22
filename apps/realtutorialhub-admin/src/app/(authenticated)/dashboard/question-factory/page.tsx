'use client';

import { Cpu } from 'lucide-react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { QuestionFactoryAIPanel } from '@/components/dashboard/QuestionFactoryAIPanel';

export default function QuestionFactoryAuditPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="Factory Analytics"
                description="AI-powered content generation statistics and metadata health."
                icon={<Cpu className="text-violet-500" size={20} />}
            />

            <div className="p-2">
                <QuestionFactoryAIPanel />
            </div>
        </div>
    );
}
