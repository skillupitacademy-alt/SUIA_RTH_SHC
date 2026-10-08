import { NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { db, placementJobs } from '@quiz/db-people';

const jobSchema = z.object({
  company: z.string().min(2),
  title: z.string().min(2),
  location: z.string().min(2),
  matchScore: z.coerce.number().min(0).max(100),
  isActive: z.coerce.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const parsed = await parseJsonOrFormBody(request, jobSchema);
  if (!parsed.ok) return parsed.response;

  const [created] = await db
    .insert(placementJobs)
    .values({
      company: parsed.data.company,
      title: parsed.data.title,
      location: parsed.data.location,
      matchScore: parsed.data.matchScore,
      isActive: parsed.data.isActive,
    })
    .returning({
      id: placementJobs.id,
      company: placementJobs.company,
      title: placementJobs.title,
      location: placementJobs.location,
      matchScore: placementJobs.matchScore,
      isActive: placementJobs.isActive,
    });

  return jsonData({ created: true, job: created }, 201);
}
