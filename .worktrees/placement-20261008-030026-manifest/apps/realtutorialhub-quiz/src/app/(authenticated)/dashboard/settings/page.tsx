'use client';

import { useAuthStore } from "@/store/auth-store";
import { recordCounter } from "@quiz/observability";
import { User, Mail, Shield, LogOut, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useShallow } from 'zustand/react/shallow';

export default function SettingsPage() {
    const { user, logout } = useAuthStore(
        useShallow((s) => ({
            user: s.user,
            logout: s.logout,
        }))
    );
    const router = useRouter();

    const handleLogout = () => {
        recordCounter('web.ui.settings.logout', 1);
        logout();
        router.push('/');
    };

    return (
        <div className="w-full space-y-12">
            {/* Header */}
            <div>
                <h2 className="text-[10px] font-black uppercase text-pink-600 tracking-[0.4em] mb-2">User Configuration</h2>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Account Settings</h1>
                <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-2 leading-relaxed">Manage your profile and account preferences.</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-sm space-y-10">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-3xl bg-pink-100/50 flex items-center justify-center text-pink-600">
                        <User size={48} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{user?.name}</h2>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{user?.role} Level Access</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 pt-10 border-t border-slate-100">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2" aria-label="Email Address">
                            <Mail size={14} className="text-pink-500" /> Email Address
                        </p>
                        <p className="text-lg font-black text-slate-700">{user?.email}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2" aria-label="Security Status">
                            <Shield size={14} className="text-pink-500" /> Security Status
                        </p>
                        <div className="flex items-center gap-2 text-green-600 font-black uppercase text-xs tracking-widest">
                            <CheckCircle2 size={16} />
                            <span>Onboarded & Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dangerous Zone */}
            <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 md:p-12 space-y-8">
                <div>
                    <h3 className="text-xl font-black text-red-600 uppercase tracking-tight">Danger Zone</h3>
                    <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mt-1">Actions in this section are permanent and strictly controlled.</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-3xl bg-white border border-red-100">
                    <div>
                        <p className="font-black text-slate-800 uppercase text-sm">Sign Out of Session</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Log out from your current device immediately.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
                    >
                        <LogOut size={18} className="mr-2" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
