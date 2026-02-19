"use client";

import { InboxPanel } from "@/components/inbox/InboxPanel";
import { Mail, Sparkles } from "lucide-react";

export default function InboxPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Mail size={16} />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mission Control</h2>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Secure Inbox <Sparkles className="text-orange-500 animate-pulse" size={24} />
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">
                        Your personal hub for adaptive study notes, level-up alerts, and strategic resources.
                    </p>
                </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 md:p-12">
                <InboxPanel />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[2rem] bg-indigo-900 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Sparkles size={18} className="text-orange-400" /> Smart Tutor Tips
                    </h4>
                    <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                        Requested Master Notes are sent to your registered email. Check your &quot;Promotions&quot; or &quot;Spam&quot; folder if you don&apos;t see them within 2 minutes.
                    </p>
                </div>
                <div className="p-8 rounded-[2rem] bg-white border border-slate-200 relative overflow-hidden group hover:border-primary/20 transition-all">
                    <h4 className="text-lg font-bold mb-2 text-slate-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" /> Privacy Notice
                    </h4>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        We never show direct download links on screen to protect your account&apos;s integrity. All high-value resources are dispatched via secure email.
                    </p>
                </div>
            </div>
        </div>
    );
}
