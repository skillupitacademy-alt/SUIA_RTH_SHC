'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { unifiedFetch } from '../../lib/unifiedFetch';

import { BrandProvider } from '../context/BrandContext';
import { BrandConfig } from '../../brandConfig';
import { OnboardingLayout } from './OnboardingLayout';
import { WelcomeStep } from './WelcomeStep';
import { ProfileStep } from './ProfileStep';
import { GoalStep } from './GoalStep';
import { DomainStep } from './DomainStep';
import { SkillLevelStep } from './SkillLevelStep';
import { InitializationStep } from './InitializationStep';
import { OnboardingData, OnboardingViewData } from '../../onboardingPageData';
import { OnboardingJourneyStatus } from '../../onboardingSessionCookie';

interface OnboardingPageProps {
  config: BrandConfig;
  data: OnboardingViewData;
}

async function persistOnboarding(data: OnboardingData, journeyStatus: OnboardingJourneyStatus) {
  const response = await unifiedFetch('/api/auth/onboarding', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      journeyStatus,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Onboarding submission failed: ${response.status}`);
  }
  
  return response.json();
}

export function OnboardingPage({ config, data: viewData }: OnboardingPageProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(viewData.initialForm);
  const progressSteps = viewData.steps.slice(1);

  const updateData = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDomain = (domain: string, subDomain?: string) => {
    setData((prev) => ({ ...prev, domain, subDomain }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSkip = async () => {
    try {
      // ✅ STEP 1: Submit onboarding data as skipped
      await persistOnboarding(data, 'skipped');
      
      // 🔥 PRODUCTION FIX: Set flag to skip initial token refresh
      // This prevents race conditions when navigating to dashboard
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('skip_initial_refresh', 'true');
      }
      
      // ✅ STEP 2: Navigate to dashboard
      // Server component will fetch fresh auth state and verify
      // No need for client-side verification - server is source of truth
      router.replace('/dashboard');
      
      console.log('[ONBOARDING_SKIP] Navigating to dashboard');
    } catch (error) {
      console.error('Onboarding skip failed:', error);
      // Even on error, try to navigate (user may already be onboarded)
      router.replace('/dashboard');
    }
  };

  const handleComplete = async () => {
    try {
      // ✅ STEP 1: Submit onboarding data
      await persistOnboarding(data, 'completed');
      
      // 🔥 PRODUCTION FIX: Set flag to skip initial token refresh
      // This prevents race conditions when navigating to dashboard
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('skip_initial_refresh', 'true');
      }
      
      // ✅ STEP 2: Navigate to dashboard
      // Server component will fetch fresh auth state and verify
      // No need for client-side verification - server is source of truth
      router.replace('/dashboard');
      
      console.log('[ONBOARDING_COMPLETE] Navigating to dashboard');
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      // Even on error, try to navigate (user may already be onboarded)
      router.replace('/dashboard');
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return data.fullName.trim() !== '' && data.educationLevel !== '';
      case 2:
        return data.primaryGoal !== '';
      case 3:
        return data.domain !== '';
      case 4:
        return data.timeCommitment !== '';
      default:
        return true;
    }
  };

  return (
    <BrandProvider brand={config}>
      {currentStep === 0 ? (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 sm:px-6">
          <WelcomeStep
            title={viewData.welcome.title}
            subtitle={viewData.welcome.subtitle}
            cards={viewData.welcome.cards}
            skipLabel={viewData.welcome.skipLabel}
            nextLabel={viewData.welcome.nextLabel}
            onStart={handleNext}
            onSkip={handleSkip}
          />
        </main>
      ) : currentStep === 5 ? (
        <OnboardingLayout
          currentStep={3}
          totalSteps={progressSteps.length}
          steps={progressSteps}
          footerText={viewData.footer.legalText}
          showBack={false}
          showContinue={false}
        >
          <InitializationStep
            messages={viewData.initialization.messages}
            subtitle={viewData.initialization.subtitle}
            onComplete={handleComplete}
          />
        </OnboardingLayout>
      ) : (
        <OnboardingLayout
          currentStep={currentStep - 1}
          totalSteps={progressSteps.length}
          steps={progressSteps}
          footerText={viewData.footer.legalText}
          onBack={currentStep > 1 ? handleBack : undefined}
          onContinue={handleNext}
          continueLabel={currentStep === 4 ? 'Finish' : 'Continue'}
          showBack={currentStep > 1}
          showContinue
          continueDisabled={!canContinue()}
        >
          {currentStep === 1 && (
            <ProfileStep
              title={viewData.profile.title}
              subtitle={viewData.profile.subtitle}
              fullName={data.fullName}
              educationLevel={data.educationLevel}
              status={data.status}
              fullNameLabel={viewData.profile.fullNameLabel}
              fullNamePlaceholder={viewData.profile.fullNamePlaceholder}
              educationLevelLabel={viewData.profile.educationLevelLabel}
              educationLevelPlaceholder={viewData.profile.educationLevelPlaceholder}
              educationLevels={viewData.profile.educationLevels}
              statusLabel={viewData.profile.statusLabel}
              statusOptions={viewData.profile.statusOptions}
              onChange={updateData}
            />
          )}
          {currentStep === 2 && (
            <GoalStep
              title={viewData.goal.title}
              subtitle={viewData.goal.subtitle}
              cards={viewData.goal.cards}
              selectedGoal={data.primaryGoal}
              onChange={(goalId) => updateData('primaryGoal', goalId)}
            />
          )}
          {currentStep === 3 && (
            <DomainStep
              title={viewData.domain.title}
              subtitle={viewData.domain.subtitle}
              cards={viewData.domain.cards}
              selectedDomain={data.domain}
              selectedSubDomain={data.subDomain}
              onChange={updateDomain}
            />
          )}
          {currentStep === 4 && (
            <SkillLevelStep
              title={viewData.skillLevel.title}
              subtitle={viewData.skillLevel.subtitle}
              skillLevelLabel={viewData.skillLevel.skillLevelLabel}
              timeCommitmentLabel={viewData.skillLevel.timeCommitmentLabel}
              levels={viewData.skillLevel.levels}
              timeCommitments={viewData.skillLevel.timeCommitments}
              skillLevel={data.skillLevel}
              timeCommitment={data.timeCommitment}
              onChange={updateData}
            />
          )}
        </OnboardingLayout>
      )}
    </BrandProvider>
  );
}
