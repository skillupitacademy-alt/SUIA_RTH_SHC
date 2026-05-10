import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  tutorialDomains,
  tutorialSubjects,
  tutorialTopics,
  tutorialSubtopics,
  tutorialContent,
} from '@quiz/db-tutorial';
import { eq, and } from 'drizzle-orm';
import { TutorialContentSchema } from '@quiz/types';
import { randomUUID } from 'crypto';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function createEmptyContent() {
  return {
    notes: { markdown: 'pending' },
    layman: {
      simpleExplanation: 'pending',
      analogyOrStory: 'pending',
      example1: { company: 'pending', content: 'pending' },
      example2: { company: 'pending', content: 'pending' },
    },
    real_life: {
      title: 'pending',
      scenario: 'pending',
      bullets: [{ label: 'pending', detail: 'pending' }],
      tip: 'pending',
    },
    technical: {
      markdown: 'pending',
      bullets: [{ term: 'pending', detail: 'pending' }],
      tip: 'pending',
    },
    code: {
      language: 'javascript',
      intro: 'pending',
      code: 'pending',
      steps: ['pending'],
    },
    ai_tutor: {
      greeting: 'pending',
      qa_pairs: [{ question: 'pending', answer: 'pending' }],
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subtopicId: subtopicSlug, subtopicInfo, section, content } = body;

    if (!subtopicSlug || !section || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get or Create Domain
    let [domain] = await db.select().from(tutorialDomains).where(eq(tutorialDomains.name, subtopicInfo.domain));
    if (!domain) {
      const [newDomain] = await db
        .insert(tutorialDomains)
        .values({
          externalId: randomUUID(),
          name: subtopicInfo.domain,
          slug: slugify(subtopicInfo.domain),
        })
        .returning();
      domain = newDomain;
    }

    // 2. Get or Create Subject
    let [subject] = await db
      .select()
      .from(tutorialSubjects)
      .where(and(eq(tutorialSubjects.domainId, domain.id), eq(tutorialSubjects.name, subtopicInfo.subject)));
    if (!subject) {
      const [newSubject] = await db
        .insert(tutorialSubjects)
        .values({
          externalId: randomUUID(),
          domainId: domain.id,
          name: subtopicInfo.subject,
          slug: slugify(subtopicInfo.subject),
        })
        .returning();
      subject = newSubject;
    }

    // 3. Get or Create Topic
    let [topic] = await db
      .select()
      .from(tutorialTopics)
      .where(and(eq(tutorialTopics.subjectId, subject.id), eq(tutorialTopics.name, subtopicInfo.topic)));
    if (!topic) {
      const [newTopic] = await db
        .insert(tutorialTopics)
        .values({
          externalId: randomUUID(),
          subjectId: subject.id,
          name: subtopicInfo.topic,
          slug: slugify(subtopicInfo.topic),
        })
        .returning();
      topic = newTopic;
    }

    // 4. Get or Create Subtopic
    let [subtopic] = await db
      .select()
      .from(tutorialSubtopics)
      .where(and(eq(tutorialSubtopics.topicId, topic.id), eq(tutorialSubtopics.name, subtopicInfo.subtopic)));
    if (!subtopic) {
      const [newSubtopic] = await db
        .insert(tutorialSubtopics)
        .values({
          externalId: randomUUID(),
          topicId: topic.id,
          name: subtopicInfo.subtopic,
          slug: subtopicSlug,
          difficultyLevels: ['beginner'],
        })
        .returning();
      subtopic = newSubtopic;
    }

    // 5. Fetch existing content row for this subtopic
    const [existingContent] = await db
      .select()
      .from(tutorialContent)
      .where(and(eq(tutorialContent.subtopicId, subtopic.id), eq(tutorialContent.difficulty, 'simple')));

    // Merge: start with empty shell, layer existing, then apply the new section
    const base = existingContent?.content ?? createEmptyContent();
    const mergedContent = { ...base, [section]: content };

    // Validate against schema (partial sections use 'pending' placeholders)
    const validatedContent = TutorialContentSchema.parse(mergedContent);

    if (existingContent) {
      await db
        .update(tutorialContent)
        .set({ content: validatedContent, updatedAt: new Date() })
        .where(eq(tutorialContent.id, existingContent.id));
    } else {
      await db.insert(tutorialContent).values({
        subtopicId: subtopic.id,
        difficulty: 'simple',
        contentType: 'standard',
        content: validatedContent,
        version: 1,
        language: 'en',
        isPublished: true,
        generatedByAi: true,
      });
    }

    return NextResponse.json({ success: true, message: `Section '${section}' saved successfully.` });
  } catch (error: unknown) {
    console.error('[Content Manager API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
