import { beforeEach, expect, it, vi } from 'vitest';
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
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); }));
});

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

it('returns profile with fallback jobs when vector service fails', async () => {
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
  
  expect(result.profile.roleGoal).toBe('Python');
  expect(result.profile.skills).toEqual(['Python', 'Machine Learning']);
  expect(result.jobs).toHaveLength(2);
  expect(result.jobs[0].match).toBe(80); // readinessScore - 0*3
  expect(result.jobs[1].match).toBe(77); // readinessScore - 1*3
  expect(result.jobs[0].company).toBe('DataTech');
  
  state.vectorError = null;
});

it('uses vector scoring when service succeeds', async () => {
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
  
  expect(result.profile.roleGoal).toBe('TypeScript');
  expect(result.jobs).toHaveLength(2);
  expect(result.jobs[0].id).toBe('job-backend-2');
  expect(result.jobs[0].match).toBe(92); // 0.92 * 100
  expect(result.jobs[1].id).toBe('job-backend-1');
  expect(result.jobs[1].match).toBe(87); // 0.87 * 100
});

it('returns fallback profile when no active profile exists', async () => {
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
  
  expect(result.profile.roleGoal).toBe('Frontend Developer');
  expect(result.profile.resumeStatus).toBe('Ready for review');
  expect(result.profile.profileCompletion).toBe(82);
  expect(result.jobs).toHaveLength(1);
  // Without profile, uses fabricated match score
  expect(result.jobs[0].match).toBe(90); // 90 - 0*3
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
  
  expect(result.profile.roleGoal).toBe('Java');
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
  // The helper does not expose deadline to the caller, so null handling is internal
});

it('does not fabricate future recording or session dates', async () => {
  // This test verifies placement does not add synthetic date fields
  state.profileRows = [[{
    userId: 'student-dates',
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
  
  const result = await getSkillupPlacement('student-dates');
  
  // Verify no synthetic fields like nextSessionAt, recordingUrl, etc.
  expect(result).toEqual({
    profile: expect.objectContaining({
      roleGoal: expect.any(String),
      resumeStatus: expect.any(String),
      profileCompletion: expect.any(Number),
      interviewCount: expect.any(Number),
      skills: expect.any(Array),
    }),
    jobs: expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        company: expect.any(String),
        title: expect.any(String),
        location: expect.any(String),
        match: expect.any(Number),
      }),
    ]),
  });
  
  // Ensure no extra date fields
  expect(Object.keys(result)).toEqual(['profile', 'jobs']);
  expect(Object.keys(result.jobs[0])).toEqual(['id', 'company', 'title', 'location', 'match']);
});
