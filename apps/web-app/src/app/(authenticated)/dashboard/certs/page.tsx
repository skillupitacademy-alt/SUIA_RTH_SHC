import { Award, Clock } from "lucide-react";

export default function CertificationsPage() {
    return (
        <div className="space-y-12">
            <div className="flex flex-col gap-3">
                <div className="h-14 w-14 rounded-2xl bg-indigo-100/50 flex items-center justify-center text-indigo-600">
                    <Award size={32} />
                </div>
                <h2 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.4em]">Credential Ledger</h2>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Certifications</h1>
                <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-1 max-w-2xl leading-relaxed">
                    Validate your expertise with industry-recognized certifications.
                    Complete your learning paths to unlock certification exams.
                </p>
            </div>

            <div className="p-12 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/10 flex flex-col items-center justify-center text-center gap-6 py-24">
                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-3xl bg-white shadow-sm border border-slate-100">
                        <Clock size={32} className="text-slate-300 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight mt-2">Engine Calibrating</h3>
                </div>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 max-w-xs leading-relaxed">
                    The Certification Engine is being calibrated for maximum precision. Resource unlocking in progress.
                </p>
            </div>
        </div>
    );
}
