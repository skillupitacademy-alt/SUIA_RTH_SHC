import { and, desc, eq, isNull } from 'drizzle-orm';

import {
  db,
  findJobsForStudent,
  jobListings,
  placementApplications,
  studentPlacementProfiles,
} from '@quiz/db-placement';

export type PlacementJobSummary = {
  id: string;
  company: string;
  title: string;
  location: string;
  match: number;
  salary: string;
  skills: string[];
  description: string;
};

export type PlacementProfileSummary = {
  roleGoal: string;
  resumeStatus: string;
  profileCompletion: number;
  interviewCount: number;
  skills: string[];
  preferredLocation: string | null;
  expectedCtc: number | null;
};

export type PlacementApplicationSummary = {
  id: string;
  status: string;
  appliedAt: string;
  notes: string | null;
};

const FALLBACK_JOBS: PlacementJobSummary[] = [
  {
    id: 'fallback-1',
    company: 'Northwind Labs',
    title: 'Frontend Developer Trainee',
    location: 'Bengaluru',
    match: 92,
    salary: '3.5 - 5 LPA',
    skills: ['React', 'TypeScript', 'REST APIs'],
    description: 'Join a product squad shipping internal tools and learner-facing dashboards.',
  },
  {
    id: 'fallback-2',
    company: 'BrightStack',
    title: 'Full Stack Engineer Intern',
    location: 'Remote',
    match: 88,
    salary: 'Stipend + PPO',
    skills: ['Next.js', 'Node.js', 'SQL'],
    description: 'Build app features end-to-end with a delivery-focused engineering mentor.',
  },
  {
    id: 'fallback-3',
    company: 'BlueOrbit',
    title: 'Support Engineer',
    location: 'Pune',
    match: 84,
    salary: '3 - 4.5 LPA',
    skills: ['Linux', 'Networking', 'Cloud basics'],
    description: 'Handle incidents, triage production issues, and document support runbooks.',
  },
];

function formatSalary(min?: number | null, max?: number | null) {
  if (min === null || min === undefined || max === null || max === undefined) {
    return 'Compensation shared during screening';
  }

  return `${(min / 100000).toFixed(1)} - ${(max / 100000).toFixed(1)} LPA`;
}

export async function listPlacementJobs(limit = 12): Promise<PlacementJobSummary[]> {
  try {
    const rows = await db
      .select({
        id: jobListings.id,
        company: jobListings.companyName,
        title: jobListings.title,
        location: jobListings.location,
        ctcMin: jobListings.ctcMin,
        ctcMax: jobListings.ctcMax,
        skills: jobListings.requiredSkills,
        description: jobListings.description,
      })
      .from(jobListings)
      .where(and(eq(jobListings.status, 'open'), isNull(jobListings.deletedAt)))
      .orderBy(desc(jobListings.deadline), desc(jobListings.createdAt))
      .limit(limit);

    if (rows.length === 0) {
      return FALLBACK_JOBS;
    }

    return rows.map((row, index) => ({
      id: row.id,
      company: row.company,
      title: row.title,
      location: row.location,
      match: Math.max(72, 96 - index * 4),
      salary: formatSalary(row.ctcMin, row.ctcMax),
      skills: row.skills,
      description: row.description,
    }));
  } catch {
    return FALLBACK_JOBS;
  }
}

export async function getPlacementJob(id: string): Promise<PlacementJobSummary | null> {
  try {
    const rows = await db
      .select({
        id: jobListings.id,
        company: jobListings.companyName,
        title: jobListings.title,
        location: jobListings.location,
        ctcMin: jobListings.ctcMin,
        ctcMax: jobListings.ctcMax,
        skills: jobListings.requiredSkills,
        description: jobListings.description,
      })
      .from(jobListings)
      .where(and(eq(jobListings.id, id), eq(jobListings.status, 'open'), isNull(jobListings.deletedAt)))
      .limit(1);

    const row = rows[0];
    if (row === undefined) {
      return FALLBACK_JOBS.find((job) => job.id === id) ?? null;
    }

    return {
      id: row.id,
      company: row.company,
      title: row.title,
      location: row.location,
      match: 90,
      salary: formatSalary(row.ctcMin, row.ctcMax),
      skills: row.skills,
      description: row.description,
    };
  } catch {
    return FALLBACK_JOBS.find((job) => job.id === id) ?? null;
  }
}

export async function getPlacementProfile(userId: string): Promise<PlacementProfileSummary | null> {
  try {
    const rows = await db
      .select({
        status: studentPlacementProfiles.status,
        readinessScore: studentPlacementProfiles.readinessScore,
        skills: studentPlacementProfiles.skills,
        preferredLocation: studentPlacementProfiles.preferredLocation,
        expectedCtc: studentPlacementProfiles.expectedCtc,
      })
      .from(studentPlacementProfiles)
      .where(and(eq(studentPlacementProfiles.userId, userId), isNull(studentPlacementProfiles.deletedAt)))
      .limit(1);

    const row = rows[0];
    if (row === undefined) {
      return null;
    }

    return {
      roleGoal: row.skills[0] ?? 'Placement-ready role',
      resumeStatus: row.status === 'active' ? 'Ready for review' : 'Paused',
      profileCompletion: row.readinessScore,
      interviewCount: Math.max(1, Math.round(row.readinessScore / 20)),
      skills: row.skills,
      preferredLocation: row.preferredLocation ?? null,
      expectedCtc: row.expectedCtc ?? null,
    };
  } catch {
    return null;
  }
}

export async function getPlacementMatches(userId: string): Promise<PlacementJobSummary[]> {
  const profile = await getPlacementProfile(userId);
  const jobs = await listPlacementJobs(8);

  if (profile === null) {
    return jobs;
  }

  try {
    const matches = await findJobsForStudent(
      {
        userId,
        readinessScore: profile.profileCompletion,
        skills: profile.skills,
        preferredLocation: profile.preferredLocation,
        expectedCtc: profile.expectedCtc,
      },
      Math.max(3, jobs.length),
    );

    const byId = new Map(jobs.map((job) => [job.id, job]));
    const ranked = matches
      .map((match) => {
        const listingId = typeof match.metadata?.listingId === 'string' ? match.metadata.listingId : '';
        const base = byId.get(listingId);
        if (base === undefined) {
          return null;
        }

        return {
          ...base,
          match: Math.max(1, Math.round((match.score ?? 0) * 100)),
        };
      })
      .filter((job): job is PlacementJobSummary => job !== null);

    if (ranked.length > 0) {
      return ranked;
    }
  } catch {
    return jobs;
  }

  return jobs;
}

export async function getPlacementApplication(
  userId: string,
  listingId: string,
): Promise<PlacementApplicationSummary | null> {
  try {
    const rows = await db
      .select({
        id: placementApplications.id,
        status: placementApplications.status,
        appliedAt: placementApplications.appliedAt,
        notes: placementApplications.notes,
      })
      .from(placementApplications)
      .where(
        and(
          eq(placementApplications.studentId, userId),
          eq(placementApplications.listingId, listingId),
          isNull(placementApplications.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (row === undefined) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      appliedAt: row.appliedAt.toISOString(),
      notes: row.notes ?? null,
    };
  } catch {
    return null;
  }
}

export async function createPlacementApplication(
  userId: string,
  listingId: string,
  notes: string | null,
): Promise<{ created: boolean; application: PlacementApplicationSummary | null }> {
  const existing = await getPlacementApplication(userId, listingId);
  if (existing !== null) {
    return { created: false, application: existing };
  }

  try {
    const inserted = await db
      .insert(placementApplications)
      .values({
        studentId: userId,
        listingId,
        notes,
      })
      .returning({
        id: placementApplications.id,
        status: placementApplications.status,
        appliedAt: placementApplications.appliedAt,
        notes: placementApplications.notes,
      });

    const row = inserted[0];
    if (row === undefined) {
      const fallback = await getPlacementApplication(userId, listingId);
      return { created: fallback !== null, application: fallback };
    }

    return {
      created: true,
      application: {
        id: row.id,
        status: row.status,
        appliedAt: row.appliedAt.toISOString(),
        notes: row.notes ?? null,
      },
    };
  } catch {
    const fallback = await getPlacementApplication(userId, listingId);
    return { created: false, application: fallback };
  }
}
