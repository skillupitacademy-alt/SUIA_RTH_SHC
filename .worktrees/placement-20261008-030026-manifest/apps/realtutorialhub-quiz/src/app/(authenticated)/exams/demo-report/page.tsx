'use client';

import React, { useState, useEffect } from 'react';
import { ExamReportLayout } from '@/components/analytics/premium/ExamReportLayout';
import { MOCK_PREMIUM_REPORT } from '@/mocks/premium-report-mock';

export default function PremiumReportDemo() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate the "Neural Synthesis" time
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bg-slate-950">
            <ExamReportLayout
                report={MOCK_PREMIUM_REPORT}
                loading={loading}
            />
        </div>
    );
}
