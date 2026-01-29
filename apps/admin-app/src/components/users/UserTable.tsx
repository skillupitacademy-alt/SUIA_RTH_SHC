'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { User, Mail, Calendar, Info, Shield, CheckCircle, XCircle, Trash2, AlertTriangle, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ErrorBanner } from '../layout/ErrorBanner';

interface UserData {
    id: string;
    email: string;
    emailVerified: boolean;
    isBlocked: boolean;
    lastActiveAt?: string;
    status?: 'online' | 'idle' | 'offline' | 'blocked';
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
    const [deletedUsers, setDeletedUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterBlocked, setFilterBlocked] = useState('ALL');
    const [filterVerified, setFilterVerified] = useState('ALL');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const serverFilters: any = {};
            if (searchQuery) serverFilters.search = searchQuery;
            if (filterRole !== 'ALL') serverFilters.role = filterRole;

            if (filterBlocked === 'BLOCKED') {
                serverFilters.isBlocked = true;
            } else if (filterBlocked === 'ACTIVE') {
                serverFilters.isBlocked = false;
            } else if (['online', 'idle', 'offline'].includes(filterBlocked.toLowerCase())) {
                serverFilters.status = filterBlocked.toLowerCase();
            }

            if (filterVerified === 'VERIFIED') serverFilters.isVerified = true;
            if (filterVerified === 'UNVERIFIED') serverFilters.isVerified = false;

            const [activeData, deletedData] = await Promise.all([
                apiClient.admin.getUsers(page, 10, 'active', serverFilters),
                apiClient.admin.getUsers(1, 10, 'deleted')
            ]);

            setUsers(activeData.users);
            setTotalPages(activeData.totalPages);
            setDeletedUsers(deletedData.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setErrorMessage('Data synchronization failure: Unable to retrieve identity matrix.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, filterRole, filterBlocked, filterVerified]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) fetchUsers();
            else setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSaving(true);
        try {
            const currentRoles = editingUser.userRoles.map(r => r.role.name);
            const payload: any = {
                isBlocked: editingUser.isBlocked,
                roles: currentRoles
            };
            if (newPassword) payload.password = newPassword;

            await apiClient.admin.updateUser(editingUser.id, payload);
            await fetchUsers();
            setEditingUser(null);
            setNewPassword('');
        } catch (error) {
            console.error('Failed to update user:', error);
            setErrorMessage('Security breach or network failure: Unable to update identity profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            await apiClient.admin.deleteUser(editingUser.id);
            await fetchUsers();
            setEditingUser(null);
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Failed to delete user:', error);
            setErrorMessage('Operation aborted: Could not terminate the target session.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAdminRole = (isAdmin: boolean) => {
        if (!editingUser) return;
        const hasAdmin = editingUser.userRoles.some(r => r.role.name === 'ADMIN');
        if (isAdmin && !hasAdmin) {
            setEditingUser({
                ...editingUser,
                userRoles: [...editingUser.userRoles, { role: { name: 'ADMIN' } }]
            });
        } else if (!isAdmin && hasAdmin) {
            setEditingUser({
                ...editingUser,
                userRoles: editingUser.userRoles.filter(r => r.role.name !== 'ADMIN')
            });
        }
    };

    if (isLoading) {
        return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading Identity Matrix...</div>;
    }

    return (
        <div className="space-y-6">
            {errorMessage && (
                <ErrorBanner
                    message={errorMessage}
                    onClose={() => setErrorMessage(null)}
                />
            )}

            {/* Filter Bar: Discovery Orchestrator */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 p-6 bg-white border border-primary/10 rounded-[2.5rem] shadow-sm">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group">
                        <User size={16} className="group-hover:text-[#FF4B91] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Identity (Name/Email)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-[#FF4B91]/20 transition-all"
                    />
                </div>

                <div className="relative">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-[#FF4B91]/20 appearance-none cursor-pointer"
                    >
                        <option value="ALL">All Access Levels</option>
                        <option value="ADMIN">Administrator</option>
                        <option value="USER">Standard User</option>
                    </select>
                </div>

                <div className="relative">
                    <select
                        value={filterBlocked}
                        onChange={(e) => setFilterBlocked(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-[#FF4B91]/20 appearance-none cursor-pointer"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ONLINE">Online Status</option>
                        <option value="IDLE">Idle Status</option>
                        <option value="OFFLINE">Offline Status</option>
                        <option value="ACTIVE">System Active</option>
                        <option value="BLOCKED">System Blocked</option>
                    </select>
                </div>

                <div className="relative">
                    <select
                        value={filterVerified}
                        onChange={(e) => setFilterVerified(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-[#FF4B91]/20 appearance-none cursor-pointer"
                    >
                        <option value="ALL">All Verification</option>
                        <option value="VERIFIED">Verified Users</option>
                        <option value="UNVERIFIED">Pending Verification</option>
                    </select>
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-primary/5 bg-primary/5">
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Identity</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Access Level</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Joined</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {users.map((user) => (
                                <tr key={user.id} className={`group transition-colors ${user.isBlocked ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-primary/5'}`}>
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
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-[#1A1A1A]">{user.profile?.name || 'Unknown Agent'}</p>
                                                    {user.emailVerified && (
                                                        <div className="p-0.5 rounded-full bg-green-500 text-white" title="Identity Verified">
                                                            <CheckCircle size={10} />
                                                        </div>
                                                    )}
                                                </div>
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
                                        <div className="flex items-center gap-2">
                                            {user.status === 'online' && (
                                                <>
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                    </span>
                                                    <span className="text-xs font-bold uppercase tracking-wide text-green-600">Online</span>
                                                </>
                                            )}
                                            {user.status === 'idle' && (
                                                <>
                                                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
                                                    <span className="text-xs font-bold uppercase tracking-wide text-yellow-600">Idle</span>
                                                </>
                                            )}
                                            {(user.status === 'offline' || !user.status) && !user.isBlocked && (
                                                <>
                                                    <div className="h-2.5 w-2.5 rounded-full bg-gray-300"></div>
                                                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Offline</span>
                                                </>
                                            )}
                                            {user.isBlocked && (
                                                <>
                                                    <Shield size={14} className="fill-current text-red-600" />
                                                    <span className="text-xs font-bold uppercase tracking-wide text-red-600">Blocked</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar size={14} />
                                            <span className="text-xs font-medium">{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-[#1A1A1A] text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                                            >
                                                Manage
                                            </button>
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-[#FF4B91]/30 hover:text-[#FF4B91] transition-all shadow-sm"
                                            >
                                                Profile
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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

            {editingUser && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="h-24 bg-gradient-to-r from-gray-900 to-gray-800 p-8 flex items-end">
                            <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">Manage Access</h2>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User Status</label>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <Shield size={18} className={editingUser.isBlocked ? "text-red-500" : "text-green-500"} />
                                            <span className="text-sm font-bold text-[#1A1A1A]">Block Access</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditingUser({ ...editingUser, isBlocked: !editingUser.isBlocked })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${editingUser.isBlocked ? 'bg-red-500' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingUser.isBlocked ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role Assignment</label>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <User size={18} className="text-[#FF4B91]" />
                                            <span className="text-sm font-bold text-[#1A1A1A]">Administrator</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-gray-300 text-[#FF4B91] focus:ring-[#FF4B91]"
                                            checked={editingUser.userRoles.some(r => r.role.name === 'ADMIN')}
                                            onChange={(e) => toggleAdminRole(e.target.checked)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security</label>
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Change Password</label>
                                            <div className="flex items-center gap-3">
                                                <Lock size={16} className="text-gray-400" />
                                                <input
                                                    type="password"
                                                    placeholder="Enter new password (optional)"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="flex-1 bg-transparent text-sm font-medium border-none focus:ring-0 placeholder:text-gray-300"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 rounded-xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/20 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
        </div>
    );
}
