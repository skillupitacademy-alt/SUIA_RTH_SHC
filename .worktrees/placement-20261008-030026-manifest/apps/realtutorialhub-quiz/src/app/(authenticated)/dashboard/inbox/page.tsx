"use client";

import { InboxPanel } from "@/components/inbox/InboxPanel";
import { Mail, Sparkles } from "lucide-react";

export default function InboxPage() {
    return (
        <div className="max-w-5xl space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3 text-pink-600">
                        <div className="p-1.5 rounded-lg bg-pink-100/50">
                            <Mail size={16} />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Mission Control</h2>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        Secure Inbox <Sparkles className="text-orange-500 animate-pulse" size={24} />
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-3 max-w-xl leading-relaxed">
                        Your personal hub for adaptive study notes, level-up alerts, and strategic resources.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                <InboxPanel />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 rounded-[2.5rem] bg-indigo-950 text-white relative overflow-hidden group shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    <h4 className="text-lg font-black mb-3 flex items-center gap-2 uppercase tracking-tight">
                        <Sparkles size={18} className="text-orange-400" /> Smart Tutor Tips
                    </h4>
                    <p className="text-indigo-200/80 text-sm leading-relaxed font-bold italic">
                        &quot;Requested Master Notes are sent to your registered email. Check your Promotions or Spam folder if you don&apos;t see them within 2 minutes.&quot;
                    </p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 relative overflow-hidden group hover:border-pink-500/20 transition-all shadow-sm">
                    <h4 className="text-lg font-black mb-3 text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <div className="w-2 h-2 rounded-full bg-pink-500" /> Privacy Notice
                    </h4>
                    <p className="text-slate-500 text-sm leading-relaxed font-bold uppercase tracking-wide text-[11px]">
                        We never show direct download links on screen to protect your account&apos;s integrity. All high-value resources are dispatched via secure email protocol.
                    </p>
                </div>
            </div>
        </div>
    );
}
