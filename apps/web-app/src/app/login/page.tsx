import { LoginForm } from "@/components/auth/AuthForms";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="flex min-h-[calc(100vh-64px)] overflow-hidden">
            {/* Visual Side */}
            <div className="hidden lg:flex flex-1 bg-primary relative items-center justify-center text-primary-foreground p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-90" />
                <div className="relative z-10 max-w-lg">
                    <ShieldCheck size={64} className="mb-8" />
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight">Securing Your Future</h1>
                    <p className="text-xl text-primary-foreground/80 leading-relaxed">
                        Access our enterprise-grade assessments and tracking tools.
                        Your path to professional mastery starts here.
                    </p>
                    <div className="mt-12 grid grid-cols-2 gap-6">
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                            <p className="text-3xl font-bold">100%</p>
                            <p className="text-sm opacity-80">Secure Platform</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                            <p className="text-3xl font-bold">50k+</p>
                            <p className="text-sm opacity-80">Active Learners</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-6 bg-muted/5">
                <LoginForm />
            </div>
        </div>
    );
}
