'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Briefcase,
    GraduationCap,
    Code,
    ShieldCheck,
    Database,
    LineChart,
    Lock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';

const ROLES = [
    { id: 'student_school', title: 'School Student', icon: User },
    { id: 'student_college', title: 'College Student', icon: GraduationCap },
    { id: 'graduate', title: 'Graduate', icon: CheckCircle2 },
    { id: 'pro', title: 'Professional', icon: Briefcase },
    { id: 'expert', title: 'Expert Pro', icon: ShieldCheck },
];

const DOMAINS = [
    { id: 'full-stack', title: 'Full Stack', icon: Code },
    { id: 'data-analyst', title: 'Data Analyst', icon: LineChart },
    { id: 'data-science', title: 'Data Science', icon: Database },
    { id: 'cyber-security', title: 'Cyber Security', icon: Lock },
    { id: 'ethical-hacking', title: 'Ethical Hacking', icon: ShieldCheck },
];

export function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        role: '',
        domain: '',
        experience: '0',
        educationLevel: '',
    });
    const router = useRouter();
    const { completeOnboarding } = useAuthStore();

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleComplete = async () => {
        setLoading(true);
        try {
            await apiClient.auth.updateProfile(data);
            completeOnboarding();
            router.push('/dashboard');
        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            {/* Progress Bar */}
            <div className="mb-12">
                <div className="flex justify-between mb-2 px-2">
                    {['Identity', 'Education', 'Path', 'Setup'].map((label, i) => (
                        <span key={label} className={cn(
                            "text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                            step >= i + 1 ? "text-primary" : "text-muted-foreground"
                        )}>
                            {label}
                        </span>
                    ))}
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-700 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
            </div>

            <div className="bg-background/80 backdrop-blur-xl border rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-primary/5 min-h-[550px] flex flex-col transition-all duration-500">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="text-center">
                            <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                                <Briefcase size={24} />
                            </div>
                            <h2 className="text-4xl font-black mb-3">Professional Status</h2>
                            <p className="text-muted-foreground text-lg">Help us tailor your learning experience</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {ROLES.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => {
                                        setData({ ...data, role: role.id });
                                        setTimeout(nextStep, 400);
                                    }}
                                    className={cn(
                                        "flex flex-col items-center gap-4 p-8 rounded-[1.5rem] border-2 transition-all duration-300 transform active:scale-95 hover:shadow-xl hover:shadow-primary/5",
                                        data.role === role.id
                                            ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                                            : "border-muted bg-muted/5 hover:border-primary/40"
                                    )}
                                >
                                    <role.icon className={cn("transition-colors duration-300", data.role === role.id ? "text-primary" : "text-muted-foreground")} size={40} />
                                    <span className="font-bold text-lg">{role.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-700">
                        <div className="text-center">
                            <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                                <GraduationCap size={24} />
                            </div>
                            <h2 className="text-4xl font-black mb-3">Education Level</h2>
                            <p className="text-muted-foreground text-lg">Define your academic background</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
                            {['High School', 'Undergraduate', 'Postgraduate', 'Doctorate', 'PhD', 'Self-Taught'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setData({ ...data, educationLevel: level })}
                                    className={cn(
                                        "px-8 py-4 rounded-2xl border-2 font-bold transition-all active:scale-95",
                                        data.educationLevel === level
                                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "border-muted bg-muted/5 hover:border-primary/40"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-700">
                        <div className="text-center">
                            <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                                <Code size={24} />
                            </div>
                            <h2 className="text-4xl font-black mb-3">Mastery Goal</h2>
                            <p className="text-muted-foreground text-lg">Choose the domain you want to dominate</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                            {DOMAINS.map((domain) => (
                                <button
                                    key={domain.id}
                                    onClick={() => setData({ ...data, domain: domain.id })}
                                    className={cn(
                                        "flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 group",
                                        data.domain === domain.id
                                            ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                                            : "border-muted bg-muted/5 hover:border-primary/40"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-xl transition-colors",
                                        data.domain === domain.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20"
                                    )}>
                                        <domain.icon size={28} />
                                    </div>
                                    <span className="font-bold text-xl">{domain.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 text-center flex-1 flex flex-col justify-center">
                        <div className="relative mx-auto w-32 h-32">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                            <div className="relative bg-primary text-primary-foreground rounded-full w-32 h-32 flex items-center justify-center shadow-2xl shadow-primary/40">
                                <CheckCircle2 size={64} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-5xl font-black mb-4">You&apos;re Elite!</h2>
                            <p className="text-muted-foreground text-xl max-w-md mx-auto leading-relaxed">
                                We&apos;re finalizing your workspace for
                                <span className="text-primary font-bold italic block text-2xl mt-2">
                                    {DOMAINS.find(d => d.id === data.domain)?.title} Mastery
                                </span>
                            </p>
                        </div>

                        <div className="bg-muted/30 border rounded-[2rem] p-8 max-w-md mx-auto w-full space-y-6">
                            <div className="flex items-center gap-4 text-lg font-bold">
                                <div className="bg-green-500 h-3 w-3 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span>Adaptive Difficulty Active</span>
                            </div>
                            <div className="flex items-center gap-4 text-lg font-bold">
                                <div className="bg-green-500 h-3 w-3 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span>Real-time Analytics Wired</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-12 flex justify-between gap-6">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            disabled={loading}
                            className="px-10 py-4 rounded-2xl border-2 font-bold flex items-center gap-3 hover:bg-muted/50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <ArrowLeft size={20} /> Back
                        </button>
                    ) : <div />}

                    <button
                        onClick={step === 4 ? handleComplete : nextStep}
                        disabled={loading || (step === 1 && !data.role) || (step === 2 && !data.educationLevel) || (step === 3 && !data.domain)}
                        className="px-12 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center gap-3 hover:bg-primary/90 hover:scale-[1.02] shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <>Initialzing...</>
                        ) : (
                            <>
                                {step === 4 ? "Launch Experience" : "Continue"}
                                {step < 4 && <ArrowRight size={22} />}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
