import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  query: vi.fn(),
  indexCtor: vi.fn(),
}));

vi.mock('@upstash/vector', () => ({
  Index: class {
    upsert = mocks.upsert;
    query = mocks.query;
    constructor() {
      mocks.indexCtor();
    }
  },
}));

import {
  buildJobVectorFilter,
  buildJobVectorText,
  buildStudentVectorFilter,
  buildStudentVectorText,
  createPlacementJobVectorIndex,
  createPlacementStudentVectorIndex,
  findJobsForStudent,
  findStudentsForJob,
  indexJobListing,
  indexStudentProfile,
} from '../vector.service';

describe('placement vector service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('UPSTASH_VECTOR_REST_URL', 'https://vector.example.com');
    vi.stubEnv('UPSTASH_VECTOR_REST_TOKEN', 'vector-token');
    mocks.upsert.mockResolvedValue({ success: true });
    mocks.query.mockResolvedValue([]);
  });

  it('builds student vector text and filter', () => {
    expect(
      buildStudentVectorText({
        userId: 'student-1',
        readinessScore: 80,
        skills: ['React', 'TypeScript'],
        experienceSummary: 'Built dashboards',
        preferredLocation: 'Bengaluru',
      })
    ).toContain('Skills: React, TypeScript');
    expect(buildStudentVectorFilter(70)).toBe('readinessScore >= 70');
  });

  it('builds job vector text and filter', () => {
    expect(
      buildJobVectorText({
        listingId: 'job-1',
        domainId: 'domain-1',
        companyName: 'BrightStack',
        title: 'Frontend Engineer',
        requiredSkills: ['React', 'Next.js'],
        description: 'Build user-facing experiences',
        location: 'Bengaluru',
      })
    ).toContain('Required skills: React, Next.js');
    expect(buildJobVectorFilter('Bengaluru')).toBe("location = 'Bengaluru'");
  });

  it('creates the placement vector indexes', () => {
    createPlacementStudentVectorIndex();
    createPlacementJobVectorIndex();
    expect(mocks.indexCtor).toHaveBeenCalledTimes(2);
  });

  it('indexes a student profile', async () => {
    await indexStudentProfile({
      userId: 'student-1',
      readinessScore: 85,
      skills: ['React'],
      experienceSummary: 'Built admin dashboards',
      preferredLocation: 'Remote',
      expectedCtc: 12,
    });

    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it('indexes a job listing', async () => {
    await indexJobListing({
      listingId: 'job-1',
      domainId: 'domain-1',
      companyName: 'BrightStack',
      title: 'Frontend Engineer',
      requiredSkills: ['React', 'Next.js'],
      description: 'Build user-facing experiences',
      location: 'Bengaluru',
      ctcMin: 8,
      ctcMax: 14,
    });

    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it('finds students for a job and jobs for a student', async () => {
    await findStudentsForJob({
      listingId: 'job-1',
      domainId: 'domain-1',
      companyName: 'BrightStack',
      title: 'Frontend Engineer',
      requiredSkills: ['React', 'Next.js'],
      description: 'Build user-facing experiences',
      location: 'Bengaluru',
    });

    await findJobsForStudent({
      userId: 'student-1',
      readinessScore: 85,
      skills: ['React'],
      experienceSummary: 'Built admin dashboards',
      preferredLocation: 'Bengaluru',
      expectedCtc: 12,
    });

    expect(mocks.query).toHaveBeenCalledTimes(2);
  });
});
