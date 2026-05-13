import { db, tutorialSections, tutorialSubtopics } from '@quiz/db-tutorial';
import { TUTORIAL_REQUIRED_MASTERY_SECTIONS, formatTutorialSectionValidationIssues, validateTutorialSection } from '@quiz/validation';
import dotenv from 'dotenv';
import { eq, isNull } from 'drizzle-orm';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

type SectionType = typeof tutorialSections.$inferSelect.sectionType;

interface AuditRow {
  subtopicId: string;
  slug: string;
  name: string;
  sectionType: SectionType;
  content: unknown;
}

async function main() {
  const subtopics = await db
    .select({
      id: tutorialSubtopics.id,
      slug: tutorialSubtopics.slug,
      name: tutorialSubtopics.name,
    })
    .from(tutorialSubtopics)
    .where(isNull(tutorialSubtopics.deletedAt));

  const rows = await db
    .select({
      subtopicId: tutorialSubtopics.id,
      slug: tutorialSubtopics.slug,
      name: tutorialSubtopics.name,
      sectionType: tutorialSections.sectionType,
      content: tutorialSections.content,
    })
    .from(tutorialSections)
    .innerJoin(tutorialSubtopics, eq(tutorialSections.subtopicId, tutorialSubtopics.id))
    .where(isNull(tutorialSections.deletedAt)) as AuditRow[];

  const rowsBySubtopic = new Map<string, AuditRow[]>();
  for (const row of rows) {
    const current = rowsBySubtopic.get(row.subtopicId) ?? [];
    current.push(row);
    rowsBySubtopic.set(row.subtopicId, current);
  }

  let invalidCount = 0;
  let missingCount = 0;

  for (const subtopic of subtopics) {
    const sectionRows = rowsBySubtopic.get(subtopic.id) ?? [];
    const sectionTypes = new Set(sectionRows.map((row) => row.sectionType));
    const missing = ['overview', ...TUTORIAL_REQUIRED_MASTERY_SECTIONS].filter((section) => !sectionTypes.has(section as SectionType));

    for (const missingSection of missing) {
      missingCount += 1;
      console.log(JSON.stringify({
        subtopicSlug: subtopic.slug,
        sectionType: missingSection,
        status: 'missing_required_section',
      }));
    }

    for (const row of sectionRows) {
      const validation = validateTutorialSection(row.sectionType, row.content);
      if (validation.success) {
        console.log(JSON.stringify({
          subtopicSlug: row.slug,
          sectionType: row.sectionType,
          status: 'valid',
        }));
        continue;
      }

      invalidCount += 1;
      console.log(JSON.stringify({
        subtopicSlug: row.slug,
        sectionType: row.sectionType,
        status: 'invalid',
        issues: validation.issues,
        summary: formatTutorialSectionValidationIssues(validation.issues),
      }));
    }
  }

  console.log(JSON.stringify({
    status: invalidCount === 0 && missingCount === 0 ? 'pass' : 'fail',
    invalidCount,
    missingCount,
    auditedSubtopics: subtopics.length,
    auditedSections: rows.length,
  }));

  if (invalidCount > 0 || missingCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[audit-tutorial-section-validation] failed', error);
  process.exit(1);
});
