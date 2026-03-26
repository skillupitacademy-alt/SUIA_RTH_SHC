import { describe, expect, it } from 'vitest';

import { skillupSeedAccounts } from '../seed-skillup';

describe('skillup seed', () => {
  it('includes canonical and fallback credentials', () => {
    const emails = skillupSeedAccounts.map((account) => account.email);

    expect(emails).toContain('student@skillupitacademy.com');
    expect(emails).toContain('admin@skillupitacademy.com');
    expect(emails).toContain('faculty@skillupitacademy.com');
    expect(emails).toContain('skillup_student@test.com');
    expect(emails).toContain('skillup_admin@test.com');
    expect(emails).toContain('faculty@test.com');
  });
});
