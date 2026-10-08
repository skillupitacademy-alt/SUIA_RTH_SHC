import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { jsonData, parseJsonOrFormBody, requireAdminOrForbidden } from '@/lib/admin-bff';
import { getAdminPlacementDetail } from '@/lib/skillup-admin-data';
import { db, studentPlacementProfiles } from '@quiz/db-people';

const placementSchema = z.object({
  targetRole: z.string().min(2),
  resumeStatus: z.string().min(2),
  profileCompletion: z.coerce.number().min(0).max(100),
  interviewCount: z.coerce.number().min(0).max(100),
  skills: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await params;
  const detail = await getAdminPlacementDetail(id);
  if (detail === undefined) {
    return jsonData({ error: 'Not found' }, 404);
  }

  return jsonData(detail, 200);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const forbidden = await requireAdminOrForbidden(request);
  if (forbidden !== null) return forbidden;

  const { id } = await params;
  const parsed = await parseJsonOrFormBody(request, placementSchema);
  if (!parsed.ok) return parsed.response;

  const [updated] = await db
    .update(studentPlacementProfiles)
    .set({
      roleGoal: parsed.data.targetRole,
      resumeStatus: parsed.data.resumeStatus,
      profileCompletion: parsed.data.profileCompletion,
      interviewCount: parsed.data.interviewCount,
      skills: parsed.data.skills
        .split(',')
        .map((skill: string) => skill.trim())
        .filter((skill: string) => skill.length > 0),
      updatedAt: new Date(),
    })
    .where(eq(studentPlacementProfiles.id, id))
    .returning({
      id: studentPlacementProfiles.id,
    });

  if (updated === undefined) {
    return jsonData({ error: 'Not found' }, 404);
  }

  const detail = await getAdminPlacementDetail(id);
  return jsonData({ updated: true, detail }, 200);
}
