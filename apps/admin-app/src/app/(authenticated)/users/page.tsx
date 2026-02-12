import { UserTable } from '@/components/users/UserTable';
import { Users } from 'lucide-react';

export default function UsersPage() {
    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-primary/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Users size={20} className="text-[#FF4B91]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Identity_Layer</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase text-[#1A1A1A]">User Management</h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Access Control • Demographics • Verification</p>
                </div>
                <div className="flex flex-col items-end gap-3 text-right">
                    <span className="px-4 py-2 rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">Read Only Access</span>
                </div>
            </div>

            <UserTable />
        </div>
    );
}
