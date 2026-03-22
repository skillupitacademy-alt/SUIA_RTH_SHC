import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('people_user_role', ['student', 'faculty', 'admin', 'super_admin']);
export const platformEnum = pgEnum('people_platform', ['realtutorialhub', 'skillup', 'both']);
export const subscriptionPlanEnum = pgEnum('people_subscription_plan', ['free', 'pro', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('people_subscription_status', ['active', 'cancelled', 'expired']);
