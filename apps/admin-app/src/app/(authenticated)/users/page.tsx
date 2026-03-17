'use client';

import { PageTitle } from '@quiz/ui';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';

import { UserCreateWizard } from '@/components/users/UserCreateWizard';
import { UserTable } from '@/components/users/UserTable';

export default function UsersPage() {
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-primary/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Users size={20} className="text-[#FF4B91]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Identity_Layer</span>
                    </div>
                    <PageTitle text="User Management" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Access Control • Demographics • Verification</p>
                </div>
                <div className="flex flex-col items-end gap-3 text-right">
                    <button
                        onClick={() => setIsWizardOpen(true)}
                        className="px-6 py-3 rounded-2xl bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest border border-black shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Plus size={16} /> Provision Identity
                    </button>
                </div>
            </div>

            <UserTable key={refreshKey} />

            <UserCreateWizard 
                isOpen={isWizardOpen} 
                onClose={() => setIsWizardOpen(false)}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </div>
    );
}
