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
    const [data, setData] = useState({
        role: '',
        domain: '',
        experience: '0',
    });
    const router = useRouter();
    const { completeOnboarding } = useAuthStore();

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleComplete = () => {
        completeOnboarding();
        router.push('/dashboard');
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            {/* Progress Bar */}
            <div className="mb-12">
                <div className="flex justify-between mb-2">
                    {['Identity', 'Focus', 'Setup'].map((label, i) => (
                        <span key={label} className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            step >= i + 1 ? "text-primary" : "text-muted-foreground"
                        )}>
                            {label}
                        </span>
                    ))}
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            <div className="bg-background border rounded-3xl p-8 md:p-12 shadow-sm min-h-[500px] flex flex-col">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-2">Who are you?</h2>
                            <p className="text-muted-foreground">Select your current professional status</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {ROLES.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setData({ ...data, role: role.id })}
                                    className={cn(
                                        "flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all hover:border-primary/50",
                                        data.role === role.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-muted bg-muted/5"
                                    )}
                                >
                                    <role.icon className={cn(data.role === role.id ? "text-primary" : "text-muted-foreground")} size={32} />
                                    <span className="font-bold">{role.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-2">Pick your path</h2>
                            <p className="text-muted-foreground">Which domain are you looking to master?</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {DOMAINS.map((domain) => (
                                <button
                                    key={domain.id}
                                    onClick={() => setData({ ...data, domain: domain.id })}
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all hover:border-primary/50",
                                        data.domain === domain.id ? "border-primary bg-primary/5" : "border-muted bg-muted/5"
                                    )}
                                >
                                    <domain.icon className={cn(data.domain === domain.id ? "text-primary" : "text-muted-foreground")} size={24} />
                                    <span className="font-bold">{domain.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center">
                        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} className="text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold">You&apos;re almost there!</h2>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            We&apos;re setting up your personalized dashboard for
                            <span className="text-foreground font-bold italic ml-1">
                                {DOMAINS.find(d => d.id === data.domain)?.title || 'your domain'}
                            </span>.
                        </p>
                        <div className="space-y-4 max-w-xs mx-auto pt-4 text-left">
                            <div className="flex items-center gap-3 text-sm font-medium">
                                <div className="bg-green-500 h-2 w-2 rounded-full" />
                                Adaptive difficulty engine active
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium">
                                <div className="bg-green-500 h-2 w-2 rounded-full" />
                                Performance analytics connected
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-12 flex justify-between gap-4">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="px-8 py-3 rounded-xl border font-bold flex items-center gap-2 hover:bg-muted/50 transition-colors"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    ) : <div />}

                    <button
                        onClick={step === 3 ? handleComplete : nextStep}
                        disabled={(step === 1 && !data.role) || (step === 2 && !data.domain)}
                        className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                        {step === 3 ? "Complete Setup" : "Continue"}
                        {step < 3 && <ArrowRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
