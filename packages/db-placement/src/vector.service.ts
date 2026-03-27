import { Index, type QueryResult } from '@upstash/vector';

export type PlacementStudentVectorMetadata = Record<string, unknown> & {
  userId: string;
  readinessScore: number;
  preferredLocation?: string | null;
  expectedCtc?: number | null;
};

export type PlacementJobVectorMetadata = Record<string, unknown> & {
  listingId: string;
  domainId: string;
  companyName: string;
  ctcMin?: number | null;
  ctcMax?: number | null;
  location: string;
};

export interface PlacementProfileVectorInput {
  userId: string;
  readinessScore: number;
  skills: string[];
  experienceSummary?: string | null;
  preferredLocation?: string | null;
  expectedCtc?: number | null;
}

export interface PlacementJobVectorInput {
  listingId: string;
  domainId: string;
  companyName: string;
  title: string;
  requiredSkills: string[];
  description: string;
  ctcMin?: number | null;
  ctcMax?: number | null;
  location: string;
}

export type PlacementStudentVectorResult = QueryResult<PlacementStudentVectorMetadata>;
export type PlacementJobVectorResult = QueryResult<PlacementJobVectorMetadata>;

function readVectorEnv() {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (url === undefined || url.trim().length === 0 || token === undefined || token.trim().length === 0) {
    throw new Error('UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN are required');
  }

  return { url, token };
}

export function createPlacementStudentVectorIndex() {
  const { url, token } = readVectorEnv();
  return new Index<PlacementStudentVectorMetadata>({ url, token });
}

export function createPlacementJobVectorIndex() {
  const { url, token } = readVectorEnv();
  return new Index<PlacementJobVectorMetadata>({ url, token });
}

function joinParts(parts: Array<string | null | undefined>) {
  return parts.map((part) => (typeof part === 'string' ? part.trim() : '')).filter(Boolean).join('\n');
}

export function buildStudentVectorText(profile: PlacementProfileVectorInput) {
  return joinParts([
    `Skills: ${profile.skills.join(', ')}`,
    profile.experienceSummary ? `Experience: ${profile.experienceSummary}` : null,
    profile.preferredLocation ? `Preferred location: ${profile.preferredLocation}` : null,
  ]);
}

export function buildJobVectorText(job: PlacementJobVectorInput) {
  return joinParts([
    `Title: ${job.title}`,
    `Company: ${job.companyName}`,
    `Location: ${job.location}`,
    `Required skills: ${job.requiredSkills.join(', ')}`,
    job.description,
  ]);
}

export function buildStudentVectorFilter(minReadinessScore = 60) {
  return `readinessScore >= ${minReadinessScore}`;
}

export function buildJobVectorFilter(location?: string | null) {
  if (typeof location !== 'string' || location.trim().length === 0) {
    return undefined;
  }
  return `location = '${location.trim().replace(/'/g, "\\'")}'`;
}

export async function indexStudentProfile(profile: PlacementProfileVectorInput) {
  const index = createPlacementStudentVectorIndex();
  const data = buildStudentVectorText(profile);
  return index.upsert([
    {
      id: profile.userId,
      data,
      metadata: {
        userId: profile.userId,
        readinessScore: profile.readinessScore,
        preferredLocation: profile.preferredLocation ?? null,
        expectedCtc: profile.expectedCtc ?? null,
      },
    },
  ]);
}

export async function indexJobListing(job: PlacementJobVectorInput) {
  const index = createPlacementJobVectorIndex();
  const data = buildJobVectorText(job);
  return index.upsert([
    {
      id: job.listingId,
      data,
      metadata: {
        listingId: job.listingId,
        domainId: job.domainId,
        companyName: job.companyName,
        ctcMin: job.ctcMin ?? null,
        ctcMax: job.ctcMax ?? null,
        location: job.location,
      },
    },
  ]);
}

export async function findStudentsForJob(job: PlacementJobVectorInput, topK = 20): Promise<PlacementStudentVectorResult[]> {
  const index = createPlacementStudentVectorIndex();
  return index.query<PlacementStudentVectorMetadata>({
    data: buildJobVectorText(job),
    topK,
    includeMetadata: true,
    includeData: false,
    filter: buildStudentVectorFilter(60),
  });
}

export async function findJobsForStudent(profile: PlacementProfileVectorInput, topK = 20): Promise<PlacementJobVectorResult[]> {
  const index = createPlacementJobVectorIndex();
  return index.query<PlacementJobVectorMetadata>({
    data: buildStudentVectorText(profile),
    topK,
    includeMetadata: true,
    includeData: false,
    filter: buildJobVectorFilter(profile.preferredLocation),
  });
}
