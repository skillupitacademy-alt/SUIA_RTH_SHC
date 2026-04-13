import { z } from 'zod';

export const ONBOARDING_SESSION_COOKIE = 'shared-onboarding-session';

export const onboardingJourneyStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'skipped',
  'completed',
]);

export type OnboardingJourneyStatus = z.infer<typeof onboardingJourneyStatusSchema>;

export const onboardingSessionSchema = z.object({
  fullName: z.string(),
  educationLevel: z.string(),
  status: z.enum(['student', 'professional']),
  primaryGoal: z.string(),
  domain: z.string(),
  subDomain: z.string().optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  timeCommitment: z.string(),
  journeyStatus: onboardingJourneyStatusSchema,
  updatedAt: z.string(),
});

export type PersistedOnboardingSession = z.infer<typeof onboardingSessionSchema>;

export const onboardingSessionInputSchema = onboardingSessionSchema.omit({
  updatedAt: true,
});

export type PersistedOnboardingSessionInput = z.infer<typeof onboardingSessionInputSchema>;

export function parseOnboardingSessionCookie(
  rawValue: string | undefined,
): PersistedOnboardingSession | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const result = onboardingSessionSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function serializeOnboardingSessionCookie(
  session: PersistedOnboardingSessionInput,
): string {
  const normalized = onboardingSessionSchema.parse({
    ...session,
    updatedAt: new Date().toISOString(),
  });

  return JSON.stringify(normalized);
}
