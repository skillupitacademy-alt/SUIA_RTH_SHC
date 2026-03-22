import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { resolve } from 'path';

import { hierarchySeed } from '../packages/db-people/src/seed';
import { HierarchySyncService, HierarchySyncPayloadSchema } from '../apps/realtutorialhub-web/src/server/hierarchy-sync.service';
import { logger } from '../apps/realtutorialhub-web/src/lib/logger';

const root = resolve(process.cwd());
dotenv.config({ path: resolve(root, '.env.local') });
dotenv.config({ path: resolve(root, '.env') });

async function main() {
  const service = new HierarchySyncService();
  const domains = [hierarchySeed.domain];
  const domainId = randomUUID();
  const subjectId = randomUUID();
  const topicId = randomUUID();
  const subtopicId = randomUUID();

  let domainCount = 0;
  let subjectCount = 0;
  let topicCount = 0;
  let subtopicCount = 0;

  for (const domain of domains) {
    domainCount += 1;
    const subjects = [hierarchySeed.subject];

    for (const subject of subjects) {
      subjectCount += 1;
      const topics = [hierarchySeed.topic];

      for (const topic of topics) {
        topicCount += 1;
        const subtopics = [hierarchySeed.subtopic];

        for (const subtopic of subtopics) {
          subtopicCount += 1;
          const mappedDifficulties = subtopic.difficultyLevels.map((difficulty) =>
            difficulty === 'beginner' ? 'simple' : difficulty,
          ) as Array<'simple' | 'mixed' | 'intermediate' | 'expert'>;

          const result = await service.sync(
            HierarchySyncPayloadSchema.parse({
              subtopicId,
              subtopicName: subtopic.name,
              subtopicSlug: subtopic.slug,
              topicId,
              topicName: topic.name,
              topicSlug: topic.slug,
              subjectId,
              subjectName: subject.name,
              subjectSlug: subject.slug,
              domainId,
              domainName: domain.name,
              domainSlug: domain.slug,
              difficulties: mappedDifficulties,
              publishedAt: new Date().toISOString(),
            })
          );

          if (result.synced) {
            logger.info({
              event: 'hierarchy.seeded_subtopic',
              subtopicId: subtopic.id,
              subtopicName: subtopic.name,
            });
          }
        }
      }
    }
  }

  logger.info({
    event: 'hierarchy.seed_complete',
    domains: domainCount,
    subjects: subjectCount,
    topics: topicCount,
    subtopics: subtopicCount,
  });
}

main().catch((error) => {
  logger.error({
    event: 'hierarchy.seed_failed',
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
