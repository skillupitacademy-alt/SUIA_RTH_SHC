import { SignupForm } from "@/components/auth/AuthForms";
import { Zap } from "lucide-react";

export default function SignupPage() {
    return (
        <div className="flex min-h-[calc(100vh-64px)] overflow-hidden bg-white">
            {/* Visual Side (match login look/feel) */}
            <div className="hidden lg:flex flex-1 bg-slate-50 relative items-center justify-center text-[#1A1A1A] p-12 border-r border-slate-100">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF2D55]/10 text-[#FF2D55] mb-8">
                        <Zap size={32} />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-[#1A1A1A] font-outfit">
                        Create Your <span className="text-[#FF2D55]">Account</span>
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed font-inter">
                        Start personalized assessments with a secure, enterprise-grade platform built for your growth.
                    </p>
                    <div className="mt-12 grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <p className="text-3xl font-black text-[#1A1A1A]">24/7</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Secure Access</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <p className="text-3xl font-black text-[#1A1A1A]">Global</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Adaptive Delivery</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-md">
                    <SignupForm />
                </div>
            </div>
        </div>
    );
}
