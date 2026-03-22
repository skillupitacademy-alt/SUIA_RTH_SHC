'use client';

import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('_token') || '';

    return (
        <div className="flex min-h-[calc(100vh-64px)] overflow-hidden">
            {/* Visual Side */}
            <div className="hidden lg:flex flex-1 bg-primary relative items-center justify-center text-primary-foreground p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-90" />
                <div className="relative z-10 max-w-lg">
                    <ShieldCheck size={64} className="mb-8" />
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight">Final Step</h1>
                    <p className="text-xl text-primary-foreground/80 leading-relaxed">
                        Security is our top priority. Choose a unique password
                        to keep your learning journey safe and secure.
                    </p>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-6 bg-muted/5">
                <ResetPasswordForm token={token} />
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
