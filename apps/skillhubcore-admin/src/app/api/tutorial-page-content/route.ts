import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  dbHttp,
  tutorialPageContentV2,
} from '@quiz/db-tutorial';
import {
  domains as shcDomains,
  getDb,
  subjects as shcSubjects,
  subtopics as shcSubtopics,
  topics as shcTopics,
} from '@quiz/db';
import type {
  TutorialCodePayload,
  TutorialDefinitionPayload,
  TutorialPageContentType,
  TutorialSidebarBrandId,
} from '@quiz/types';

export const dynamic = 'force-dynamic';

const definitionSchema: z.ZodType<TutorialDefinitionPayload> = z.object({
  page: z.object({
    type: z.string().min(1),
    category: z.string().optional(),
    title: z.string().min(1),
    intro: z.string().min(1),
    definition: z.string().min(1),
    explanation: z.array(z.string()),
    example: z.object({
      language: z.string().min(1),
      code: z.string().min(1),
    }).optional(),
    characteristics: z.array(z.object({
      icon: z.string().optional(),
      title: z.string().min(1),
      description: z.string().min(1),
    })).optional(),
    takeaway: z.string().optional(),
  }),
});

const codeSchema: z.ZodType<TutorialCodePayload> = z.object({
  page: z.object({
    type: z.string().min(1),
    title: z.string().min(1),
    introduction: z.string().min(1),
  }),
  code: z.object({
    language: z.string().min(1),
    prismLanguage: z.string().optional(),
    source: z.string().min(1),
  }),
  explanation: z.object({
    steps: z.array(z.object({
      number: z.number(),
      code: z.string(),
      description: z.string(),
    })),
  }).optional(),
  output: z.object({
    inputExample: z.record(z.string()).optional(),
    value: z.string(),
  }).optional(),
  memoryModel: z.record(z.unknown()).optional(),
  takeaway: z.object({
    items: z.array(z.string()),
  }).optional(),
  tip: z.object({
    text: z.string(),
  }).optional(),
});

const saveSchema = z.object({
  brandId: z.enum(['realtutorialhub', 'skillup', 'shared']),
  domainId: z.string().uuid(),
  subjectId: z.string().uuid(),
  topicId: z.string().uuid(),
  subtopicId: z.string().uuid(),
  contentType: z.enum(['definition', 'code']),
  payload: z.unknown(),
  sourceFormat: z.enum(['json', 'markdown']),
  sourceContent: z.string().min(1),
  status: z.enum(['draft', 'published']),
});

function validatePayload(contentType: TutorialPageContentType, payload: unknown) {
  return contentType === 'definition'
    ? definitionSchema.safeParse(payload)
    : codeSchema.safeParse(payload);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getHierarchy(domainId: string, subjectId: string, topicId: string, subtopicId: string) {
  const db = getDb();
  const [domain] = await db.select().from(shcDomains).where(eq(shcDomains.id, domainId)).limit(1);
  const [subject] = await db.select().from(shcSubjects).where(eq(shcSubjects.id, subjectId)).limit(1);
  const [topic] = await db.select().from(shcTopics).where(eq(shcTopics.id, topicId)).limit(1);
  const [subtopic] = await db.select().from(shcSubtopics).where(eq(shcSubtopics.id, subtopicId)).limit(1);

  return { domain, subject, topic, subtopic };
}

async function responseFromRow(row: typeof tutorialPageContentV2.$inferSelect) {
  const hierarchy = await getHierarchy(row.domainId, row.subjectId, row.topicId, row.subtopicId);

  return {
    scope: {
      brandId: row.brandId,
      domainId: row.domainId,
      domainSlug: hierarchy.domain ? slugify(hierarchy.domain.name) : '',
      domainName: hierarchy.domain?.name ?? '',
      subjectId: row.subjectId,
      subjectSlug: hierarchy.subject ? slugify(hierarchy.subject.name) : '',
      subjectName: hierarchy.subject?.name ?? '',
      topicId: row.topicId,
      topicSlug: hierarchy.topic ? slugify(hierarchy.topic.name) : '',
      topicName: hierarchy.topic?.name ?? '',
      subtopicId: row.subtopicId,
      subtopicSlug: hierarchy.subtopic ? slugify(hierarchy.subtopic.name) : '',
      subtopicName: hierarchy.subtopic?.name ?? '',
    },
    contentType: row.contentType,
    payload: row.payload,
    sourceFormat: row.sourceFormat,
    sourceContent: row.sourceContent,
    status: row.status,
    version: row.version,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId') as TutorialSidebarBrandId | null;
    const subtopicId = searchParams.get('subtopicId');
    const contentType = searchParams.get('contentType') as TutorialPageContentType | null;

    if (!brandId || !subtopicId || !contentType) {
      return NextResponse.json({ error: 'brandId, subtopicId, and contentType are required.' }, { status: 400 });
    }

    const [row] = await dbHttp
      .select()
      .from(tutorialPageContentV2)
      .where(and(
        eq(tutorialPageContentV2.brandId, brandId),
        eq(tutorialPageContentV2.subtopicId, subtopicId),
        eq(tutorialPageContentV2.contentType, contentType)
      ))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'Tutorial page content not found.' }, { status: 404 });
    }

    return NextResponse.json(await responseFromRow(row));
  } catch (error) {
    console.error('[Tutorial Page Content API] GET failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = saveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid tutorial content payload.', details: parsed.error.flatten() }, { status: 400 });
    }

    const body = parsed.data;
    const payloadValidation = validatePayload(body.contentType, body.payload);
    if (!payloadValidation.success) {
      return NextResponse.json({ error: `Invalid ${body.contentType} payload.`, details: payloadValidation.error.flatten() }, { status: 400 });
    }

    const now = new Date();
    const values = {
      brandId: body.brandId,
      domainId: body.domainId,
      subjectId: body.subjectId,
      topicId: body.topicId,
      subtopicId: body.subtopicId,
      contentType: body.contentType,
      payload: payloadValidation.data,
      sourceFormat: body.sourceFormat,
      sourceContent: body.sourceContent,
      status: body.status,
      publishedAt: body.status === 'published' ? now : null,
      updatedAt: now,
    };

    const [saved] = await dbHttp
      .insert(tutorialPageContentV2)
      .values(values)
      .onConflictDoUpdate({
        target: [
          tutorialPageContentV2.brandId,
          tutorialPageContentV2.subtopicId,
          tutorialPageContentV2.contentType,
        ],
        set: {
          ...values,
          version: sql`${tutorialPageContentV2.version} + 1`,
        },
      })
      .returning();

    const content = await responseFromRow(saved);
    const deliveryPath = `/tutorial-v2/${content.scope.domainSlug}/${content.scope.subjectSlug}/${content.scope.topicSlug}/${content.scope.subtopicSlug}`;

    return NextResponse.json({
      success: true,
      message: body.status === 'published' ? 'Tutorial content published and saved.' : 'Tutorial content draft saved.',
      content,
      deliveryUrls: {
        realtutorialhub: deliveryPath,
        skillup: deliveryPath,
      },
    });
  } catch (error) {
    console.error('[Tutorial Page Content API] POST failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
