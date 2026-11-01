import { NextResponse } from 'next/server';

/** Retired source-file writer. Authoring belongs to the authenticated admin workflow. */
export async function POST() {
  return NextResponse.json(
    { error: 'Content authoring is unavailable in learner applications. Use SkillHubCore Admin.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
