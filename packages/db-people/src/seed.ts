import { db } from './db';
import { domains, subjects, subtopics, topics } from './schema';

export const hierarchySeed = {
  domain: {
    name: 'Full Stack',
    slug: 'full-stack',
    description: 'Full stack development hierarchy',
  },
  subject: {
    name: 'JavaScript',
    slug: 'javascript',
    description: 'JavaScript programming',
  },
  topic: {
    name: 'Asynchronous Programming',
    slug: 'asynchronous-programming',
    description: 'Promises, async/await, and concurrency',
  },
  subtopic: {
    name: 'JavaScript Promises',
    slug: 'javascript-promises',
    description: 'Promise fundamentals',
    difficultyLevels: ['beginner', 'intermediate'] as string[],
  },
} as const;

export async function seedHierarchyData(): Promise<void> {
  await db.transaction(async (tx) => {
    const [domain] = await tx.insert(domains).values(hierarchySeed.domain).returning({ id: domains.id });
    const [subject] = await tx
      .insert(subjects)
      .values({ ...hierarchySeed.subject, domainId: domain.id })
      .returning({ id: subjects.id });
    const [topic] = await tx
      .insert(topics)
      .values({ ...hierarchySeed.topic, subjectId: subject.id })
      .returning({ id: topics.id });
    await tx.insert(subtopics).values({ ...hierarchySeed.subtopic, topicId: topic.id }).returning({ id: subtopics.id });
  });
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('seed.ts')) {
  void seedHierarchyData();
}
