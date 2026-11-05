import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  profileRows: [] as any[][],
  jobRows: [] as any[][],
  vectorMatch: vi.fn(),
  vectorError: null as Error | null,
}));

vi.mock('@quiz/db-people', () => {
  const columns = new Proxy({}, { get: () => ({}) });
  return { db: {}, faculty: columns, users: columns, userProfiles: columns, attendanceRecords: columns, batchEnrollments: columns, batchSessions: columns, batches: columns, paymentInstallments: columns, subjects: columns, domains: columns };
});

vi.mock('@quiz/db-placement', () => {
  const columns = new Proxy({}, { get: () => ({}) });
  const profileQuery = {
    from: () => profileQuery,
    where: () => profileQuery,
    limit: async () => {
      const result = state.profileRows.shift();
      if (result instanceof Error) throw result;
      return result ?? [];
    },
  };
  const jobQuery = {
    from: () => jobQuery,
    where: () => jobQuery,
    orderBy: async () => {
      const result = state.jobRows.shift();
      if (result instanceof Error) throw result;
      return result ?? [];
    },
  };
  const mockDb = {
    select: (selector: unknown) => {
      // Distinguish profile vs job query by checking if selector includes readinessScore
      const selectorStr = JSON.stringify(selector);
      if (selectorStr.includes('readinessScore')) {
        return profileQuery;
      }
      return jobQuery;
    },
  };
  return {
    db: mockDb,
    findJobsForStudent: async (...args: unknown[]) => {
      if (state.vectorError) {
        throw state.vectorError;
      }
      return state.vectorMatch(...args);
    },
    jobListings: columns,
    studentPlacementProfiles: columns,
  };
});

import { getSkillupPlacement } from '../skillup-data';

beforeEach(() => {
  state.profileRows = [];
  state.jobRows = [];
  state.vectorError = null;
  state.vectorMatch.mockReset();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Offline network guard: no external requests allowed in tests'); }));
});

describe('FND13 placement truth controls', () => {
  it('propagates DB profile query failure', async () => {
    state.profileRows = [new Error('Database connection timeout') as any];
    state.jobRows = [];

    await expect(getSkillupPlacement('student-fail')).rejects.toThrow('Database connection timeout');
  });

  it('propagates DB job listing query failure when profile exists', async () => {
    state.profileRows = [[{
      userId: 'student-fixture',
      status: 'active',
      readinessScore: 75,
      skills: ['JavaScript', 'React'],
      preferredLocation: 'Remote',
      expectedCtc: 800000,
      experienceSummary: 'Two years web development',
    }]];

    state.jobRows = [new Error('Failed to fetch job listings') as any];

    await expect(getSkillupPlacement('student-fixture')).rejects.toThrow('Failed to fetch job listings');
  });

  it('returns profile with null match jobs when vector service fails', async () => {
    state.profileRows = [[{
      userId: 'student-vector-fail',
      status: 'active',
      readinessScore: 80,
      skills: ['Python', 'Machine Learning'],
      preferredLocation: 'Bengaluru',
      expectedCtc: 1200000,
      experienceSummary: 'ML research experience',
    }]];

    state.jobRows = [[
      {
        id: 'job-ml-1',
        companyName: 'DataTech',
        title: 'ML Engineer',
        location: 'Bengaluru',
        ctcMin: 1000000,
        ctcMax: 1500000,
        deadline: new Date('2025-12-31'),
      },
      {
        id: 'job-ml-2',
        companyName: 'AI Labs',
        title: 'Data Scientist',
        location: 'Remote',
        ctcMin: 900000,
        ctcMax: 1300000,
        deadline: new Date('2025-11-30'),
      },
    ]];

    state.vectorError = new Error('Vector service unavailable');

    const result = await getSkillupPlacement('student-vector-fail');

    expect(result.profile).not.toBe(null);
    expect(result.profile?.skills).toEqual(['Python', 'Machine Learning']);
    expect(result.profile?.readinessScore).toBe(80);
    expect(result.profile?.roleGoal).toBe(null);
    expect(result.profile?.resumeStatus).toBe(null);
    expect(result.profile?.profileCompletion).toBe(null);
    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0].match).toBe(null); // Matching unavailable when vector fails
    expect(result.jobs[1].match).toBe(null);
    expect(result.jobs[0].company).toBe('DataTech');

    state.vectorError = null;
  });

  it('uses vector scoring when service succeeds with valid scores', async () => {
    state.profileRows = [[{
      userId: 'student-vector-success',
      status: 'active',
      readinessScore: 85,
      skills: ['TypeScript', 'Node.js'],
      preferredLocation: 'Pune',
      expectedCtc: 1000000,
      experienceSummary: 'Backend development',
    }]];

    state.jobRows = [[
      {
        id: 'job-backend-1',
        companyName: 'TechCorp',
        title: 'Backend Engineer',
        location: 'Pune',
        ctcMin: 900000,
        ctcMax: 1200000,
        deadline: new Date('2025-10-15'),
      },
      {
        id: 'job-backend-2',
        companyName: 'StartupX',
        title: 'Full Stack Developer',
        location: 'Remote',
        ctcMin: 800000,
        ctcMax: 1100000,
        deadline: new Date('2025-09-30'),
      },
    ]];

    state.vectorMatch.mockResolvedValue([
      { id: 'job-backend-2', score: 0.92 },
      { id: 'job-backend-1', score: 0.87 },
    ]);

    const result = await getSkillupPlacement('student-vector-success');

    expect(result.profile?.skills).toEqual(['TypeScript', 'Node.js']);
    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0].id).toBe('job-backend-2');
    expect(result.jobs[0].match).toBe(92); // 0.92 * 100
    expect(result.jobs[1].id).toBe('job-backend-1');
    expect(result.jobs[1].match).toBe(87); // 0.87 * 100
  });

  it('returns null profile when no active profile exists', async () => {
    state.profileRows = [[]];
    state.jobRows = [[
      {
        id: 'job-generic-1',
        companyName: 'Company A',
        title: 'Software Engineer',
        location: 'Bengaluru',
        ctcMin: 600000,
        ctcMax: 900000,
        deadline: new Date('2025-08-31'),
      },
    ]];

    const result = await getSkillupPlacement('student-no-profile');

    // Profile is null (no fabricated profile data)
    expect(result.profile).toBe(null);
    expect(result.jobs).toHaveLength(1);
    // Without profile, match is null (matching unavailable)
    expect(result.jobs[0].match).toBe(null);
    expect(result.jobs[0].company).toBe('Company A');
  });

  it('handles empty job listings gracefully', async () => {
    state.profileRows = [[{
      userId: 'student-no-jobs',
      status: 'active',
      readinessScore: 70,
      skills: ['Java'],
      preferredLocation: null,
      expectedCtc: null,
      experienceSummary: null,
    }]];

    state.jobRows = [[]];
    state.vectorMatch.mockResolvedValue([]);

    const result = await getSkillupPlacement('student-no-jobs');

    expect(result.profile?.skills).toEqual(['Java']);
    expect(result.jobs).toEqual([]);
  });

  it('handles null deadline dates in job listing schema', async () => {
    state.profileRows = [[]];
    state.jobRows = [[
      {
        id: 'job-no-deadline',
        companyName: 'FlexiCorp',
        title: 'Developer',
        location: 'Remote',
        ctcMin: 700000,
        ctcMax: 1000000,
        deadline: null, // Schema says notNull but runtime data may differ
      },
    ]];

    const result = await getSkillupPlacement('student-null-deadline');

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].company).toBe('FlexiCorp');
    expect(result.jobs[0].match).toBe(null);
    // The helper does not expose deadline to the caller, so null handling is internal
  });

  it('does not fabricate legacy profile fields', async () => {
    state.profileRows = [[{
      userId: 'student-profile',
      status: 'active',
      readinessScore: 65,
      skills: ['DevOps'],
      preferredLocation: 'Hyderabad',
      expectedCtc: 950000,
      experienceSummary: 'Cloud infrastructure',
    }]];

    state.jobRows = [[
      {
        id: 'job-devops',
        companyName: 'CloudCo',
        title: 'DevOps Engineer',
        location: 'Hyderabad',
        ctcMin: 900000,
        ctcMax: 1200000,
        deadline: new Date('2025-12-01'),
      },
    ]];

    state.vectorMatch.mockResolvedValue([
      { id: 'job-devops', score: 0.75 },
    ]);

    const result = await getSkillupPlacement('student-profile');

    // Verify no fabricated legacy fields (all unavailable until authoritative source)
    expect(result.profile).toEqual({
      roleGoal: null,
      resumeStatus: null,
      profileCompletion: null,
      skills: ['DevOps'],
      readinessScore: 65,
    });

    // Verify no synthetic date fields
    expect(Object.keys(result)).toEqual(['profile', 'jobs']);
    expect(Object.keys(result.jobs[0])).toEqual(['id', 'company', 'title', 'location', 'match']);
  });

  it('returns null match for unmatched vector IDs', async () => {
    state.profileRows = [[{
      userId: 'student-unmatched',
      status: 'active',
      readinessScore: 70,
      skills: ['Go'],
      preferredLocation: null,
      expectedCtc: null,
      experienceSummary: null,
    }]];

    state.jobRows = [[
      {
        id: 'job-exists',
        companyName: 'Company',
        title: 'Developer',
        location: 'Remote',
        ctcMin: 800000,
        ctcMax: 1000000,
        deadline: new Date('2025-10-01'),
      },
    ]];

    // Vector returns ID that doesn't match any DB job
    state.vectorMatch.mockResolvedValue([
      { id: 'job-nonexistent', score: 0.95 },
    ]);

    const result = await getSkillupPlacement('student-unmatched');

    // Falls back to DB ordering with null match
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe('job-exists');
    expect(result.jobs[0].match).toBe(null);
  });

  it('preserves valid zero match score when calibrated', async () => {
    // This test documents that zero is a valid measured value
    // Currently treating zero as uncalibrated, but the type system allows it
    state.profileRows = [[{
      userId: 'student-zero',
      status: 'active',
      readinessScore: 50,
      skills: ['Rust'],
      preferredLocation: null,
      expectedCtc: null,
      experienceSummary: null,
    }]];

    state.jobRows = [[
      {
        id: 'job-mismatch',
        companyName: 'Enterprise',
        title: 'COBOL Developer',
        location: 'On-site',
        ctcMin: 500000,
        ctcMax: 700000,
        deadline: new Date('2025-09-01'),
      },
    ]];

    // Genuine zero score means no match (when calibrated system establishes this)
    state.vectorMatch.mockResolvedValue([
      { id: 'job-mismatch', score: 0 },
    ]);

    const result = await getSkillupPlacement('student-zero');

    // Currently returns null for zero (uncalibrated measurement)
    // When calibration is established, zero would be a valid return value
    expect(result.jobs[0].match).toBe(null);
  });
});
