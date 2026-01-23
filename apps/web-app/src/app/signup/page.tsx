import { SignupForm } from "@/components/auth/AuthForms";
import { Zap } from "lucide-react";

export default function SignupPage() {
    return (
        <div className="flex min-h-[calc(100vh-64px)] overflow-hidden">
            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-6 bg-muted/5">
                <SignupForm />
            </div>

            {/* Visual Side */}
            <div className="hidden lg:flex flex-1 bg-secondary relative items-center justify-center text-primary-foreground p-12">
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary to-primary opacity-90" />
                <div className="relative z-10 max-w-lg">
                    <Zap size={64} className="mb-8" />
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight">Accelerate Your Growth</h1>
                    <p className="text-xl text-primary-foreground/80 leading-relaxed">
                        Create your account to start personalized assessments in your domain.
                    </p>
                    <ul className="mt-12 space-y-4">
                        {['Adaptive Difficulty', 'In-depth Analytics', 'Skill Certification', 'Expert Support'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-lg font-medium">
                                <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
