'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/store/auth-store";
import { User, Mail, Shield, LogOut, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto bg-muted/5">
                    <div className="max-w-4xl mx-auto space-y-10">
                        {/* Header */}
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
                            <p className="text-muted-foreground mt-2">Manage your profile and account preferences.</p>
                        </div>

                        {/* Profile Card */}
                        <div className="bg-background rounded-[2.5rem] border p-8 md:p-12 shadow-sm space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User size={48} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{user?.name}</h2>
                                    <p className="text-muted-foreground font-medium">{user?.role} Account</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 pt-6 border-t">
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <p className="text-lg font-bold">{user?.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <Shield size={14} /> Security Status
                                    </label>
                                    <div className="flex items-center gap-2 text-green-600 font-bold">
                                        <CheckCircle2 size={16} />
                                        <span>Onboarded & Verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dangerous Zone */}
                        <div className="bg-red-500/5 rounded-[2.5rem] border-2 border-red-500/10 p-8 md:p-12 space-y-6">
                            <h3 className="text-xl font-black text-red-600">Danger Zone</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="font-bold">Sign Out of Session</p>
                                    <p className="text-sm text-muted-foreground">Log out from your current device.</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
                                >
                                    <LogOut size={18} className="mr-2" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
