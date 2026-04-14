import { cookies } from 'next/headers';

import { fetchBackendAuthState } from './auth/serverAuthState';
import { BrandConfig } from './brandConfig';
import {
  DomainCard,
  GoalCard,
  OnboardingData,
  domainCards,
  educationLevels,
  goalCards,
  timeCommitments,
} from './OnboardingEngine/models/onboardingSession';
import { parseOnboardingSessionCookie, ONBOARDING_SESSION_COOKIE } from './onboardingSessionCookie';

export type { OnboardingData } from './OnboardingEngine/models/onboardingSession';

export interface OnboardingStatusOption {
  value: 'student' | 'professional';
  label: string;
}

export interface OnboardingSkillLevelOption {
  id: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  description: string;
}

export interface OnboardingWelcomeCard {
  title: string;
  description: string;
  illustration: 'learn' | 'exam';
  emphasized: boolean;
}

export interface OnboardingViewData {
  steps: string[];
  welcome: {
    title: string;
    subtitle: string;
    cards: OnboardingWelcomeCard[];
    skipLabel: string;
    nextLabel: string;
  };
  profile: {
    title: string;
    subtitle: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    educationLevelLabel: string;
    educationLevelPlaceholder: string;
    statusLabel: string;
    statusOptions: OnboardingStatusOption[];
    educationLevels: string[];
  };
  goal: {
    title: string;
    subtitle: string;
    cards: GoalCard[];
  };
  domain: {
    title: string;
    subtitle: string;
    cards: DomainCard[];
  };
  skillLevel: {
    title: string;
    subtitle: string;
    skillLevelLabel: string;
    timeCommitmentLabel: string;
    levels: OnboardingSkillLevelOption[];
    timeCommitments: string[];
  };
  initialization: {
    subtitle: string;
    messages: string[];
  };
  footer: {
    legalText: string;
  };
  initialForm: OnboardingData;
}

export interface OnboardingApiResponse {
  step_labels: string[];
  welcome_screen: {
    headline: string;
    supporting_copy: string;
    cards: Array<{
      heading: string;
      body: string;
      illustration_key: 'learn' | 'exam';
      emphasized: boolean;
    }>;
    primary_cta_label: string;
    secondary_cta_label: string;
  };
  profile_screen: {
    heading: string;
    supporting_copy: string;
    full_name: {
      label: string;
      placeholder: string;
    };
    education_level: {
      label: string;
      placeholder_option: string;
      options: string[];
    };
    current_status: {
      label: string;
      options: OnboardingStatusOption[];
    };
  };
  goal_screen: {
    heading: string;
    supporting_copy: string;
    options: GoalCard[];
  };
  domain_screen: {
    heading: string;
    supporting_copy: string;
    options: DomainCard[];
  };
  skill_level_screen: {
    heading: string;
    supporting_copy: string;
    skill_level_label: string;
    time_commitment_label: string;
    levels: OnboardingSkillLevelOption[];
    time_commitment_options: string[];
  };
  initialization_screen: {
    supporting_copy: string;
    rotating_messages: string[];
  };
  footer_bar: {
    legal_text: string;
  };
  session_seed: Partial<OnboardingData>;
}

const defaultFormData: OnboardingData = {
  fullName: '',
  educationLevel: '',
  status: 'student',
  primaryGoal: '',
  domain: '',
  subDomain: '',
  skillLevel: 'beginner',
  timeCommitment: '',
};

function mapSessionToInitialForm(session: Partial<OnboardingData> | null): OnboardingData {
  return {
    ...defaultFormData,
    ...session,
  };
}

function extractPersistedFormState(session: ReturnType<typeof parseOnboardingSessionCookie>): Partial<OnboardingData> | null {
  if (!session) {
    return null;
  }

  return {
    fullName: session.fullName,
    educationLevel: session.educationLevel,
    status: session.status,
    primaryGoal: session.primaryGoal,
    domain: session.domain,
    subDomain: session.subDomain,
    skillLevel: session.skillLevel,
    timeCommitment: session.timeCommitment,
  };
}

function extractBackendFormState(user: Awaited<ReturnType<typeof fetchBackendAuthState>>): Partial<OnboardingData> | null {
  if (user === null) {
    return null;
  }

  return {
    fullName: user.fullName ?? user.name ?? '',
    educationLevel: user.educationLevel ?? '',
    status: user.status === 'professional' ? 'professional' : 'student',
    primaryGoal: user.primaryGoal ?? '',
    domain: user.domain ?? '',
    subDomain: user.subDomain ?? '',
    skillLevel: user.skillLevel ?? 'beginner',
    timeCommitment: user.timeCommitment ?? '',
  };
}

export function mapOnboardingApiToViewData(api: OnboardingApiResponse): OnboardingViewData {
  return {
    steps: api.step_labels,
    welcome: {
      title: api.welcome_screen.headline,
      subtitle: api.welcome_screen.supporting_copy,
      cards: api.welcome_screen.cards.map((card) => ({
        title: card.heading,
        description: card.body,
        illustration: card.illustration_key,
        emphasized: card.emphasized,
      })),
      skipLabel: api.welcome_screen.secondary_cta_label,
      nextLabel: api.welcome_screen.primary_cta_label,
    },
    profile: {
      title: api.profile_screen.heading,
      subtitle: api.profile_screen.supporting_copy,
      fullNameLabel: api.profile_screen.full_name.label,
      fullNamePlaceholder: api.profile_screen.full_name.placeholder,
      educationLevelLabel: api.profile_screen.education_level.label,
      educationLevelPlaceholder: api.profile_screen.education_level.placeholder_option,
      statusLabel: api.profile_screen.current_status.label,
      statusOptions: api.profile_screen.current_status.options,
      educationLevels: api.profile_screen.education_level.options,
    },
    goal: {
      title: api.goal_screen.heading,
      subtitle: api.goal_screen.supporting_copy,
      cards: api.goal_screen.options,
    },
    domain: {
      title: api.domain_screen.heading,
      subtitle: api.domain_screen.supporting_copy,
      cards: api.domain_screen.options,
    },
    skillLevel: {
      title: api.skill_level_screen.heading,
      subtitle: api.skill_level_screen.supporting_copy,
      skillLevelLabel: api.skill_level_screen.skill_level_label,
      timeCommitmentLabel: api.skill_level_screen.time_commitment_label,
      levels: api.skill_level_screen.levels,
      timeCommitments: api.skill_level_screen.time_commitment_options,
    },
    initialization: {
      subtitle: api.initialization_screen.supporting_copy,
      messages: api.initialization_screen.rotating_messages,
    },
    footer: {
      legalText: api.footer_bar.legal_text,
    },
    initialForm: mapSessionToInitialForm(api.session_seed),
  };
}

function buildOnboardingApiResponse(
  brand: BrandConfig,
  sessionSeed: Partial<OnboardingData> | null,
): OnboardingApiResponse {
  return {
    step_labels: ['Welcome', 'Profile', 'Goal', 'Domain', 'Skill Level'],
    welcome_screen: {
      headline: `Welcome to ${brand.name}!`,
      supporting_copy:
        'Start your personalized learning journey today. Set your first goal to begin.',
      cards: [
        {
          heading: 'Learn New Skills',
          body: 'Gain practical knowledge, master new tools, and advance your career path.',
          illustration_key: 'learn',
          emphasized: true,
        },
        {
          heading: 'Crack Exams & Certifications',
          body: 'Prepare effectively with practice tests, structured courses, and expert guidance.',
          illustration_key: 'exam',
          emphasized: false,
        },
      ],
      primary_cta_label: 'Next: Create Profile',
      secondary_cta_label: 'Skip for now',
    },
    profile_screen: {
      heading: 'Tell us a bit about yourself',
      supporting_copy: 'This helps us personalize your learning experience',
      full_name: {
        label: 'Full Name',
        placeholder: 'Enter your full name',
      },
      education_level: {
        label: 'Education Level',
        placeholder_option: 'Select your education level',
        options: educationLevels,
      },
      current_status: {
        label: 'Current Status',
        options: [
          { value: 'student', label: 'Student' },
          { value: 'professional', label: 'Working Professional' },
        ],
      },
    },
    goal_screen: {
      heading: 'What is your primary goal?',
      supporting_copy: 'This helps us set up your learning engine correctly',
      options: goalCards,
    },
    domain_screen: {
      heading: 'Which field do you want to master?',
      supporting_copy: 'Choose your area of focus',
      options: domainCards,
    },
    skill_level_screen: {
      heading: 'Where are you currently standing?',
      supporting_copy: 'Help us match the right difficulty level',
      skill_level_label: 'Your skill level',
      time_commitment_label: 'How much time can you commit?',
      levels: [
        { id: 'beginner', title: 'Beginner', description: "I'm starting fresh" },
        { id: 'intermediate', title: 'Intermediate', description: 'I know the basics' },
        {
          id: 'advanced',
          title: 'Advanced',
          description: 'I want to master complex topics',
        },
      ],
      time_commitment_options: timeCommitments,
    },
    initialization_screen: {
      supporting_copy: 'Please wait while we set up your personalized learning experience',
      rotating_messages: [
        'Saving preferences...',
        'Generating AI learning path...',
        'Initializing tutorial engine...',
        'Setting up your dashboard...',
        'Almost ready...',
      ],
    },
    footer_bar: {
      legal_text: brand.onboardingFooterText,
    },
    session_seed: sessionSeed ?? {},
  };
}

export async function loadOnboardingData(brand: BrandConfig): Promise<OnboardingViewData> {
  const cookieStore = await cookies();
  const session = parseOnboardingSessionCookie(cookieStore.get(ONBOARDING_SESSION_COOKIE)?.value);
  const backendUser = await fetchBackendAuthState();
  const apiResponse = buildOnboardingApiResponse(
    brand,
    extractBackendFormState(backendUser) ?? extractPersistedFormState(session),
  );

  return mapOnboardingApiToViewData(apiResponse);
}
