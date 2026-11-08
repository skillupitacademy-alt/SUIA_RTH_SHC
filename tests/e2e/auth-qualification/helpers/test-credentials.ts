/**
 * Test credential accessors.
 *
 * Reads only environment-provided credentials for authorized synthetic test accounts.
 * NEVER hardcodes credentials, passwords, or tokens.
 */

export interface TestAccountConfig {
  emailEnvVar: string;
  passwordEnvVar: string;
}

export const SYNTHETIC_ACCOUNTS = {
  SUIA_LEARNER: {
    emailEnvVar: 'TEST_SUIA_LEARNER_EMAIL',
    passwordEnvVar: 'TEST_SUIA_LEARNER_PASSWORD',
  },
  RTH_LEARNER: {
    emailEnvVar: 'TEST_RTH_LEARNER_EMAIL',
    passwordEnvVar: 'TEST_RTH_LEARNER_PASSWORD',
  },
  SHC_ADMIN: {
    emailEnvVar: 'TEST_SHC_ADMIN_EMAIL',
    passwordEnvVar: 'TEST_SHC_ADMIN_PASSWORD',
  },
  BLOCKED_LEARNER: {
    emailEnvVar: 'TEST_BLOCKED_LEARNER_EMAIL',
    passwordEnvVar: 'TEST_BLOCKED_LEARNER_PASSWORD',
  },
  CROSS_TENANT_LEARNER: {
    emailEnvVar: 'TEST_CROSS_TENANT_EMAIL',
    passwordEnvVar: 'TEST_CROSS_TENANT_PASSWORD',
  },
};

export function getAccountCredentials(config: TestAccountConfig): { email: string; password: string } {
  const email = process.env[config.emailEnvVar];
  const password = process.env[config.passwordEnvVar];

  if (!email || !password) {
    throw new Error(
      `Synthetic test credentials missing in environment: [${config.emailEnvVar}, ${config.passwordEnvVar}]`
    );
  }

  return { email, password };
}
