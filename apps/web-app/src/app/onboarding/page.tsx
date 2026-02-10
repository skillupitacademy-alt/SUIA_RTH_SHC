import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-muted/5 py-12 md:py-16 w-full max-w-full">
            <OnboardingWizard />
        </div>
    );
}
