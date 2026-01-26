'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { User, Mail, Calendar, Info, Shield, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserData {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
    userRoles: { role: { name: string } }[];
    profile?: {
        name?: string;
        avatarUrl?: string;
        educationLevel?: string;
        professionalStatus?: string;
        ageGroup?: string;
        experienceYears?: number;
        domainInterests?: string[];
    };
}

export function UserTable() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await apiClient.admin.getUsers(page, 10);
                setUsers(data.users);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [page]);

    if (isLoading) {
        return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading Identity Matrix...</div>;
    }

    return (
        <>
            <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-primary/5 bg-primary/5">
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Identity</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Access Level</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Verification</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Joined</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {users.map((user) => (
                                <tr key={user.id} className="group hover:bg-primary/5 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-white shadow-sm">
                                                {user.profile?.avatarUrl ? (
                                                    <img src={user.profile.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                                                ) : (
                                                    <User size={18} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#1A1A1A]">{user.profile?.name || 'Unknown Agent'}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Mail size={10} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {user.userRoles.map((r, i) => (
                                                <span key={i} className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${r.role.name === 'admin' ? 'bg-[#FF4B91]/10 text-[#FF4B91] border-[#FF4B91]/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {r.role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        {user.emailVerified ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle size={14} />
                                                <span className="text-xs font-bold uppercase tracking-wide">Verified</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-orange-500">
                                                <XCircle size={14} />
                                                <span className="text-xs font-bold uppercase tracking-wide">Pending</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar size={14} />
                                            <span className="text-xs font-medium">{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-gray-50 hover:border-[#FF4B91]/30 hover:text-[#FF4B91] transition-all shadow-sm"
                                        >
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-primary/5 flex items-center justify-between">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91] transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-bold text-muted-foreground">Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91] transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="h-32 bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E] p-8 flex items-end">
                            <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">{selectedUser.profile?.name || 'Agent Profile'}</h2>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Professional Status</label>
                                    <p className="font-bold text-lg text-[#1A1A1A]">{selectedUser.profile?.professionalStatus || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Education</label>
                                    <p className="font-bold text-lg text-[#1A1A1A]">{selectedUser.profile?.educationLevel || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Experience</label>
                                    <p className="font-bold text-lg text-[#1A1A1A]">{selectedUser.profile?.experienceYears ? `${selectedUser.profile.experienceYears} Years` : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Age Group</label>
                                    <p className="font-bold text-lg text-[#1A1A1A]">{selectedUser.profile?.ageGroup || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Domain Interests</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUser.profile?.domainInterests?.map((interest, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                                            {interest}
                                        </span>
                                    )) || <span className="text-sm text-gray-400 italic">No specific interests declared.</span>}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="px-8 py-3 rounded-xl bg-[#1A1A1A] text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-colors"
                                >
                                    Close Dossier
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
