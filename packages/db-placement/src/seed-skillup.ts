import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { Pool } from 'pg';

import { db, jobListings, studentPlacementProfiles } from './index';

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

function getPeopleDatabaseUrl() {
  return (
    process.env.DATABASE_DIRECT_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.PEOPLE_DATABASE_URL?.trim() ||
    ''
  );
}

async function resolveStudentUserId() {
  const databaseUrl = getPeopleDatabaseUrl();
  if (databaseUrl.length === 0) {
    return 'student@skillupitacademy.com';
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query<{ id: string }>('SELECT id FROM users WHERE email = $1 LIMIT 1', [
      'student@skillupitacademy.com',
    ]);

    return rows[0]?.id ?? 'student@skillupitacademy.com';
  } finally {
    await pool.end();
  }
}

async function main() {
  const userId = await resolveStudentUserId();

  await db
    .insert(studentPlacementProfiles)
    .values({
      userId,
      status: 'active',
      readinessScore: 82,
      skills: ['React', 'Next.js', 'TypeScript', 'REST APIs', 'Testing'],
      preferredLocation: 'Bengaluru',
      expectedCtc: 12,
      experienceSummary: 'Built live student dashboards and deployment-ready projects.',
      resumeUrl: 'https://skillupitacademy.com/resumes/student-1.pdf',
    })
    .onConflictDoUpdate({
      target: [studentPlacementProfiles.userId],
      set: {
        status: 'active',
        readinessScore: 82,
        skills: ['React', 'Next.js', 'TypeScript', 'REST APIs', 'Testing'],
        preferredLocation: 'Bengaluru',
        expectedCtc: 12,
        experienceSummary: 'Built live student dashboards and deployment-ready projects.',
        resumeUrl: 'https://skillupitacademy.com/resumes/student-1.pdf',
        updatedAt: new Date(),
        deletedAt: null,
      },
    });

  const listings: Array<{
    domainId: string;
    companyName: string;
    title: string;
    location: string;
    jobType: string;
    status: 'draft' | 'open' | 'closed' | 'paused';
    deadline: Date;
    ctcMin: number;
    ctcMax: number;
    requiredSkills: string[];
    description: string;
  }> = [
    {
      domainId: '00000000-0000-0000-0000-000000000001',
      companyName: 'BrightStack',
      title: 'Junior Frontend Engineer',
      location: 'Bengaluru',
      jobType: 'full_time',
      status: 'open',
      deadline: new Date('2026-05-01T18:30:00.000Z'),
      ctcMin: 8,
      ctcMax: 14,
      requiredSkills: ['React', 'TypeScript', 'Next.js'],
      description: 'Build customer-facing portals with modern React and Next.js.',
    },
    {
      domainId: '00000000-0000-0000-0000-000000000002',
      companyName: 'Northwind Labs',
      title: 'Product Engineer Intern',
      location: 'Remote',
      jobType: 'internship',
      status: 'open',
      deadline: new Date('2026-05-15T18:30:00.000Z'),
      ctcMin: 6,
      ctcMax: 10,
      requiredSkills: ['JavaScript', 'APIs', 'Testing'],
      description: 'Ship product improvements and help keep the platform stable.',
    },
  ] as const;

  for (const listing of listings) {
    await db
      .insert(jobListings)
      .values({
        ...listing,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: [jobListings.companyName, jobListings.title],
        set: {
          domainId: listing.domainId,
          companyName: listing.companyName,
          title: listing.title,
          location: listing.location,
          jobType: listing.jobType,
          status: listing.status,
          deadline: listing.deadline,
          ctcMin: listing.ctcMin,
          ctcMax: listing.ctcMax,
          requiredSkills: listing.requiredSkills,
          description: listing.description,
          updatedAt: new Date(),
          deletedAt: null,
        },
      });
  }

  console.log('Seeded placement_prod with 1 student profile and 2 job listings');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
