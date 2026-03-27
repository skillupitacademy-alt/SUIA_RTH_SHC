import { PlatformEventTypes, publishEvent } from '@quiz/events';
import type { PeoplePlatform, PeopleUserRole } from '@quiz/types';

import type { SubscriptionPlan } from '@/modules/subscription/subscription.repository';

const USER_REGISTERED_URL = process.env.SKILLHUBCORE_USER_REGISTERED_URL ?? 'https://placeholder.invalid/consumers/user-registered';
const SUBSCRIPTION_UPGRADED_URL = process.env.SKILLHUBCORE_SUBSCRIPTION_UPGRADED_URL ?? 'https://placeholder.invalid/consumers/subscription-upgraded';

export interface UserRegisteredEventInput {
  userId: string;
  email: string;
  platform: PeoplePlatform;
  role: Exclude<PeopleUserRole, 'super_admin'>;
  registeredAt: string;
}

export interface SubscriptionUpgradedEventInput {
  userId: string;
  planType: SubscriptionPlan;
  features: string[];
  upgradedAt: string;
}

export const publishUserRegistered = async (input: UserRegisteredEventInput): Promise<void> => {
  await publishEvent(PlatformEventTypes.USER_REGISTERED, input, {
    destinationUrl: USER_REGISTERED_URL,
    source: 'skillhubcore-service',
  });
};

export const publishSubscriptionUpgraded = async (input: SubscriptionUpgradedEventInput): Promise<void> => {
  await publishEvent(PlatformEventTypes.SUBSCRIPTION_UPGRADED, input, {
    destinationUrl: SUBSCRIPTION_UPGRADED_URL,
    source: 'skillhubcore-service',
  });
};
