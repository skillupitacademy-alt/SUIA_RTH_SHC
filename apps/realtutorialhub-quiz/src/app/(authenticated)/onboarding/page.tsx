"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useAuthStore } from '@/store/auth-store';
import { useShallow } from 'zustand/react/shallow';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, initialized } = useAuthStore(
        useShallow((state) => ({
            user: state.user,
            initialized: state.initialized,
        }))
    );

    useEffect(() => {
        if (initialized && user?.onboarded) {
            router.replace('/dashboard');
        }
    }, [initialized, router, user?.onboarded]);

    if (initialized && user?.onboarded) {
        return null;
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-muted/5 py-12 md:py-16 w-full max-w-full">
            <OnboardingWizard />
        </div>
    );
}
