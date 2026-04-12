'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandProvider } from '../context/BrandContext';
import { brands } from '../../brandConfig';
import { OnboardingLayout } from './OnboardingLayout';
import { WelcomeStep } from './WelcomeStep';
import { ProfileStep } from './ProfileStep';
import { GoalStep } from './GoalStep';
import { DomainStep } from './DomainStep';
import { SkillLevelStep } from './SkillLevelStep';
import { InitializationStep } from './InitializationStep';
import { OnboardingData } from '../models/onboardingSession';

interface OnboardingPageProps {
  brand: 'rth' | 'skillup';
}

export function OnboardingPage({ brand: brandKey }: OnboardingPageProps) {
  const brand = brands[brandKey];
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    educationLevel: '',
    status: 'student',
    primaryGoal: '',
    domain: '',
    subDomain: '',
    skillLevel: 'beginner',
    timeCommitment: ''
  });

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

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleComplete = () => {
    console.log('Onboarding completed:', data);
    router.push('/dashboard');
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
        return data.skillLevel !== '' && data.timeCommitment !== '';
      default:
        return true;
    }
  };

  return (
    <BrandProvider brand={brand}>
      {currentStep === 0 ? (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
          <WelcomeStep onStart={handleNext} onSkip={handleSkip} />
        </main>
      ) : currentStep === 5 ? (
        <OnboardingLayout
          currentStep={4}
          totalSteps={5}
          showBack={false}
          showContinue={false}
        >
          <InitializationStep onComplete={handleComplete} />
        </OnboardingLayout>
      ) : (
        <OnboardingLayout
          currentStep={currentStep - 1}
          totalSteps={5}
          onBack={currentStep > 1 ? handleBack : undefined}
          onContinue={handleNext}
          continueLabel={currentStep === 4 ? 'Finish' : 'Continue'}
          showBack={currentStep > 1}
          showContinue={true}
          continueDisabled={!canContinue()}
        >
          {currentStep === 1 && (
            <ProfileStep
              fullName={data.fullName}
              educationLevel={data.educationLevel}
              status={data.status}
              onChange={updateData}
            />
          )}
          {currentStep === 2 && (
            <GoalStep
              selectedGoal={data.primaryGoal}
              onChange={(goalId) => updateData('primaryGoal', goalId)}
            />
          )}
          {currentStep === 3 && (
            <DomainStep
              selectedDomain={data.domain}
              selectedSubDomain={data.subDomain}
              onChange={updateDomain}
            />
          )}
          {currentStep === 4 && (
            <SkillLevelStep
              skillLevel={data.skillLevel as 'beginner' | 'intermediate' | 'advanced' | ''}
              timeCommitment={data.timeCommitment}
              onChange={updateData}
            />
          )}
        </OnboardingLayout>
      )}
    </BrandProvider>
  );
}
