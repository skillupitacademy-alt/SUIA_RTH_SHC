#!/usr/bin/env tsx
/**
 * ============================================================================
 * PHASE 11.18F — COMPOSER PUBLISH FORENSIC E2E
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Reproduce the EXACT ensureTopicHierarchySynced() logic with transaction
 * ROLLBACK to identify the exact failing operation WITHOUT leaving any
 * database mutations behind.
 *
 * This script:
 * - Reads MainDB hierarchy (same as production)
 * - Executes TutorialDB UPSERTs (same as production)
 * - Captures which SYNC step fails
 * - ALWAYS rolls back the transaction
 * - Verifies TutorialDB remains unchanged
 *
 * CRITICAL RULE
 * -------------
 * This script MUST NOT create permanent TutorialDB records.
 * All operations are inside a transaction that ALWAYS rolls back.
 *
 * ============================================================================
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { and, eq, isNull, sql } from 'drizzle-orm';
import { 
  getDb,
  domains,
  subjects,
  topics,
  subtopics,
} from '@quiz/db';
import { 
  db as tutorialDb, 
  tutorialDomains,
  tutorialSubjects,
  tutorialTopics,
  tutorialSubtopics,
} from '@quiz/db-tutorial';

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

const TOPIC_ID = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';

const EXPECTED_BASELINE = {
  tutorialDomains: 0,
  tutorialSubjects: 0,
  tutorialTopics: 0,
  tutorialSubtopics: 0,
  tutorialSidebarTreesV2: 1,
  tutorialSections: 0,
};

/* ============================================================================
 * TYPES
 * ========================================================================== */

type SyncStep = {
  step: string;
  status: 'START' | 'SUCCESS' | 'FAILED';
  operation: string;
  details?: Record<string, unknown>;
  error?: Record<string, unknown>;
};

const syncSteps: SyncStep[] = [];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function section(title: string): void {
  console.log('');
  console.log('='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
  console.log('');
}

function recordStep(
  step: string,
  status: 'START' | 'SUCCESS' | 'FAILED',
  operation: string,
  details?: Record<string, unknown>,
  error?: Record<string, unknown>,
): void {
  syncSteps.push({ step, status, operation, details, error });
  
  if (status === 'FAILED') {
    console.error(`❌ [${step}] ${status} — ${operation}`);
    if (error) {
      console.error('   Error:', JSON.stringify(error, null, 2));
    }
  } else if (status === 'START') {
    console.log(`🔵 [${step}] ${status} — ${operation}`);
    if (details) {
      console.log('   ', JSON.stringify(details, null, 2));
    }
  } else {
    console.log(`✅ [${step}] ${status} — ${operation}`);
    if (details) {
      console.log('   ', JSON.stringify(details, null, 2));
    }
  }
}

function inspectError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const candidate = error as Error & Record<string, unknown>;
    return {
      name: error.name,
      message: error.message,
      code: candidate.code ?? null,
      constraint: candidate.constraint ?? null,
      table: candidate.table ?? null,
      column: candidate.column ?? null,
      detail: candidate.detail ?? null,
      hint: candidate.hint ?? null,
      routine: candidate.routine ?? null,
      stack: error.stack ?? null,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    return {
      name: candidate.name ?? null,
      message: candidate.message ?? null,
      code: candidate.code ?? null,
      constraint: candidate.constraint ?? null,
      table: candidate.table ?? null,
      column: candidate.column ?? null,
      detail: candidate.detail ?? null,
      hint: candidate.hint ?? null,
      raw: candidate,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

async function captureBaseline(): Promise<Record<string, number>> {
  const counts = await Promise.all([
    tutorialDb.execute(sql`SELECT COUNT(*)::int as count FROM tutorial_domains`),
    tutorialDb.execute(sql`SELECT COUNT(*)::int as count FROM tutorial_subjects`),
    tutorialDb.execute(sql`SELECT COUNT(*)::int as count FROM tutorial_topics`),
    tutorialDb.execute(sql`SELECT COUNT(*)::int as count FROM tutorial_subtopics`),
    tutorialDb.execute(sql`SELECT COUNT(*)::int as count FROM tutorial_sidebar_trees_v2`),
    tutorialDb.execute(sql`SELECT COUNT(*)::int as count FROM tutorial_sections`),
  ]);

  return {
    tutorialDomains: Number((counts[0].rows[0] as any).count),
    tutorialSubjects: Number((counts[1].rows[0] as any).count),
    tutorialTopics: Number((counts[2].rows[0] as any).count),
    tutorialSubtopics: Number((counts[3].rows[0] as any).count),
    tutorialSidebarTreesV2: Number((counts[4].rows[0] as any).count),
    tutorialSections: Number((counts[5].rows[0] as any).count),
  };
}

function verifyBaseline(
  before: Record<string, number>,
  after: Record<string, number>,
): boolean {
  const tables = Object.keys(before);
  let unchanged = true;

  for (const table of tables) {
    if (before[table] !== after[table]) {
      console.error(`❌ MUTATION DETECTED: ${table} changed from ${before[table]} to ${after[table]}`);
      unchanged = false;
    }
  }

  if (unchanged) {
    console.log('✅ TutorialDB baseline UNCHANGED (transaction rolled back successfully)');
  }

  return unchanged;
}

/* ============================================================================
 * MAIN FORENSIC TEST
 * ========================================================================== */

async function main(): Promise<void> {
  console.log('');
  console.log('PHASE 11.18F — COMPOSER PUBLISH FORENSIC E2E');
  console.log('');
  console.log('READ-ONLY / TRANSACTION ROLLBACK');
  console.log('NO PERSISTENT DATABASE MUTATIONS');
  console.log('');
  console.log('Target: Full Stack Development → Backend Development → Java');
  console.log(`Topic ID: ${TOPIC_ID}`);
  console.log('');

  // ============================================================
  // CAPTURE BASELINE
  // ============================================================

  section('BASELINE CAPTURE');
  const baselineBefore = await captureBaseline();
  console.log('TutorialDB baseline BEFORE test:');
  console.log(JSON.stringify(baselineBefore, null, 2));

  const baselineMatch = Object.keys(EXPECTED_BASELINE).every(
    (key) => baselineBefore[key] === EXPECTED_BASELINE[key as keyof typeof EXPECTED_BASELINE],
  );

  if (!baselineMatch) {
    console.error('');
    console.error('❌ BASELINE MISMATCH');
    console.error('Expected:', EXPECTED_BASELINE);
    console.error('Actual:', baselineBefore);
    console.error('');
    console.error('TutorialDB is not at expected state.');
    console.error('This test requires the Phase 11.17B clean baseline.');
    process.exitCode = 1;
    return;
  }

  console.log('✅ Baseline matches expected state');

  // ============================================================
  // MAINDB READS (SAME AS PRODUCTION)
  // ============================================================

  section('MAINDB HIERARCHY RESOLUTION');

  const db = getDb();
  const now = new Date();

  // SYNC-01 — Topic
  recordStep('SYNC-01', 'START', 'MainDB topic lookup', { topicId: TOPIC_ID });
  let topic: any;
  try {
    const topicRows = await db.select().from(topics).where(eq(topics.id, TOPIC_ID));
    
    if (topicRows.length === 0) {
      throw new Error(`Topic not found: ${TOPIC_ID}`);
    }
    topic = topicRows[0];
    recordStep('SYNC-01', 'SUCCESS', 'MainDB topic lookup', {
      topicId: topic.id,
      topicName: topic.name,
      subjectId: topic.subjectId,
    });
  } catch (error) {
    recordStep('SYNC-01', 'FAILED', 'MainDB topic lookup', undefined, inspectError(error));
    console.error('');
    console.error('FIRST FAILURE: SYNC-01 (MainDB topic lookup)');
    console.error('');
    process.exitCode = 1;
    return;
  }

  // SYNC-02 — Subject
  recordStep('SYNC-02', 'START', 'MainDB subject lookup', { subjectId: topic.subjectId });
  let subject: any;
  try {
    const subjectRows = await db.select().from(subjects).where(eq(subjects.id, topic.subjectId));
    
    if (subjectRows.length === 0) {
      throw new Error(`Subject not found: ${topic.subjectId}`);
    }
    subject = subjectRows[0];
    recordStep('SYNC-02', 'SUCCESS', 'MainDB subject lookup', {
      subjectId: subject.id,
      subjectName: subject.name,
      domainId: subject.domainId,
    });
  } catch (error) {
    recordStep('SYNC-02', 'FAILED', 'MainDB subject lookup', undefined, inspectError(error));
    console.error('');
    console.error('FIRST FAILURE: SYNC-02 (MainDB subject lookup)');
    console.error('');
    process.exitCode = 1;
    return;
  }

  // SYNC-03 — Domain
  recordStep('SYNC-03', 'START', 'MainDB domain lookup', { domainId: subject.domainId });
  let domain: any;
  try {
    const domainRows = await db.select().from(domains).where(eq(domains.id, subject.domainId));
    
    if (domainRows.length === 0) {
      throw new Error(`Domain not found: ${subject.domainId}`);
    }
    domain = domainRows[0];
    recordStep('SYNC-03', 'SUCCESS', 'MainDB domain lookup', {
      domainId: domain.id,
      domainName: domain.name,
    });
  } catch (error) {
    recordStep('SYNC-03', 'FAILED', 'MainDB domain lookup', undefined, inspectError(error));
    console.error('');
    console.error('FIRST FAILURE: SYNC-03 (MainDB domain lookup)');
    console.error('');
    process.exitCode = 1;
    return;
  }

  // SYNC-04 — Active Subtopics
  recordStep('SYNC-04', 'START', 'MainDB active subtopics lookup', { topicId: TOPIC_ID });
  let activeSubtopics: any[];
  try {
    activeSubtopics = await db
      .select()
      .from(subtopics)
      .where(
        and(
          eq(subtopics.topicId, TOPIC_ID),
          isNull(subtopics.deletedAt),
        ),
      );
    recordStep('SYNC-04', 'SUCCESS', 'MainDB active subtopics lookup', {
      topicId: TOPIC_ID,
      count: activeSubtopics.length,
      subtopics: activeSubtopics.map((s: any) => ({ id: s.id, name: s.name })),
    });
  } catch (error) {
    recordStep('SYNC-04', 'FAILED', 'MainDB active subtopics lookup', undefined, inspectError(error));
    console.error('');
    console.error('FIRST FAILURE: SYNC-04 (MainDB subtopics lookup)');
    console.error('');
    process.exitCode = 1;
    return;
  }

  // ============================================================
  // TUTORIALDB TRANSACTION (WITH ROLLBACK)
  // ============================================================

  section('TUTORIALDB SYNC TRANSACTION (WILL ROLLBACK)');

  // Helper to generate unique slug (same as production)
  const uniqueSlug = (name: string, entityId: string) => {
    const slugified = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    const suffix = entityId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return `${slugified}-${suffix.length > 0 ? suffix : entityId.slice(0, 8)}`;
  };

  let firstFailure: { step: string; error: Record<string, unknown> } | null = null;

  try {
    await tutorialDb.transaction(async (tx) => {
      console.log('🔵 Transaction BEGIN');

      // SYNC-05 — Domain UPSERT
      recordStep('SYNC-05', 'START', 'TutorialDB domain UPSERT', {
        table: 'tutorial_domains',
        externalId: domain.id,
        name: domain.name,
      });
      
      let tutorialDomain: any;
      try {
        [tutorialDomain] = await tx
          .insert(tutorialDomains)
          .values({
            externalId: domain.id,
            name: domain.name,
            slug: uniqueSlug(domain.name, domain.id),
            deletedAt: null,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: tutorialDomains.externalId,
            set: {
              name: domain.name,
              slug: uniqueSlug(domain.name, domain.id),
              deletedAt: null,
              updatedAt: now,
            },
          })
          .returning({ id: tutorialDomains.id });
        
        recordStep('SYNC-05', 'SUCCESS', 'TutorialDB domain UPSERT', {
          table: 'tutorial_domains',
          externalId: domain.id,
          internalId: tutorialDomain.id,
        });
      } catch (error) {
        const errorDetails = inspectError(error);
        recordStep('SYNC-05', 'FAILED', 'TutorialDB domain UPSERT', undefined, errorDetails);
        firstFailure = { step: 'SYNC-05', error: errorDetails };
        throw error;
      }

      // SYNC-06 — Subject UPSERT
      recordStep('SYNC-06', 'START', 'TutorialDB subject UPSERT', {
        table: 'tutorial_subjects',
        externalId: subject.id,
        name: subject.name,
        parentDomainId: tutorialDomain.id,
      });
      
      let tutorialSubject: any;
      try {
        [tutorialSubject] = await tx
          .insert(tutorialSubjects)
          .values({
            externalId: subject.id,
            domainId: tutorialDomain.id,
            name: subject.name,
            slug: uniqueSlug(subject.name, subject.id),
            deletedAt: null,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: tutorialSubjects.externalId,
            set: {
              domainId: tutorialDomain.id,
              name: subject.name,
              slug: uniqueSlug(subject.name, subject.id),
              deletedAt: null,
              updatedAt: now,
            },
          })
          .returning({ id: tutorialSubjects.id });
        
        recordStep('SYNC-06', 'SUCCESS', 'TutorialDB subject UPSERT', {
          table: 'tutorial_subjects',
          externalId: subject.id,
          internalId: tutorialSubject.id,
        });
      } catch (error) {
        const errorDetails = inspectError(error);
        recordStep('SYNC-06', 'FAILED', 'TutorialDB subject UPSERT', undefined, errorDetails);
        firstFailure = { step: 'SYNC-06', error: errorDetails };
        throw error;
      }

      // SYNC-07 — Topic UPSERT
      recordStep('SYNC-07', 'START', 'TutorialDB topic UPSERT', {
        table: 'tutorial_topics',
        externalId: topic.id,
        name: topic.name,
        parentSubjectId: tutorialSubject.id,
      });
      
      let tutorialTopic: any;
      try {
        [tutorialTopic] = await tx
          .insert(tutorialTopics)
          .values({
            externalId: topic.id,
            subjectId: tutorialSubject.id,
            name: topic.name,
            slug: uniqueSlug(topic.name, topic.id),
            deletedAt: null,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: tutorialTopics.externalId,
            set: {
              subjectId: tutorialSubject.id,
              name: topic.name,
              slug: uniqueSlug(topic.name, topic.id),
              deletedAt: null,
              updatedAt: now,
            },
          })
          .returning({ id: tutorialTopics.id });
        
        recordStep('SYNC-07', 'SUCCESS', 'TutorialDB topic UPSERT', {
          table: 'tutorial_topics',
          externalId: topic.id,
          internalId: tutorialTopic.id,
        });
      } catch (error) {
        const errorDetails = inspectError(error);
        recordStep('SYNC-07', 'FAILED', 'TutorialDB topic UPSERT', undefined, errorDetails);
        firstFailure = { step: 'SYNC-07', error: errorDetails };
        throw error;
      }

      // SYNC-08 — Subtopic UPSERTs
      for (const subtopic of activeSubtopics) {
        recordStep('SYNC-08', 'START', 'TutorialDB subtopic UPSERT', {
          table: 'tutorial_subtopics',
          externalId: subtopic.id,
          name: subtopic.name,
          parentTopicId: tutorialTopic.id,
        });
        
        try {
          const [tutorialSubtopic] = await tx
            .insert(tutorialSubtopics)
            .values({
              externalId: subtopic.id,
              topicId: tutorialTopic.id,
              name: subtopic.name,
              slug: uniqueSlug(subtopic.name, subtopic.id),
              difficultyLevels: [],
              deletedAt: null,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: tutorialSubtopics.externalId,
              set: {
                topicId: tutorialTopic.id,
                name: subtopic.name,
                slug: uniqueSlug(subtopic.name, subtopic.id),
                difficultyLevels: [],
                deletedAt: null,
                updatedAt: now,
              },
            })
            .returning({ id: tutorialSubtopics.id });
          
          recordStep('SYNC-08', 'SUCCESS', 'TutorialDB subtopic UPSERT', {
            table: 'tutorial_subtopics',
            externalId: subtopic.id,
            internalId: tutorialSubtopic.id,
          });
        } catch (error) {
          const errorDetails = inspectError(error);
          recordStep('SYNC-08', 'FAILED', 'TutorialDB subtopic UPSERT', undefined, errorDetails);
          firstFailure = { step: 'SYNC-08', error: errorDetails };
          throw error;
        }
      }

      console.log('✅ All UPSERTs succeeded within transaction');
      console.log('🔵 Forcing ROLLBACK (intentional for forensic test)');
      
      // ALWAYS rollback - throw to abort transaction
      throw new Error('FORENSIC_TEST_ROLLBACK');
    });
  } catch (error: any) {
    if (error.message === 'FORENSIC_TEST_ROLLBACK') {
      console.log('✅ Transaction rolled back successfully (intentional)');
    } else {
      console.error('');
      console.error('❌ Transaction failed and rolled back');
      console.error('');
    }
  }

  // ============================================================
  // VERIFY BASELINE UNCHANGED
  // ============================================================

  section('BASELINE VERIFICATION');
  const baselineAfter = await captureBaseline();
  console.log('TutorialDB baseline AFTER test:');
  console.log(JSON.stringify(baselineAfter, null, 2));
  console.log('');

  const unchanged = verifyBaseline(baselineBefore, baselineAfter);

  if (!unchanged) {
    console.error('');
    console.error('❌ CRITICAL: Database mutation detected despite rollback!');
    console.error('This indicates a transaction boundary problem.');
    process.exitCode = 1;
    return;
  }

  // ============================================================
  // FINAL REPORT
  // ============================================================

  section('PHASE 11.18F — FORENSIC REPORT');

  if (firstFailure) {
    console.log('');
    console.log('============================================================');
    console.log(`FIRST FAILURE: ${firstFailure.step}`);
    console.log('============================================================');
    console.log('');
    console.log('Error Details:');
    console.log(JSON.stringify(firstFailure.error, null, 2));
    console.log('');
    console.log('ROOT CAUSE IDENTIFIED ✅');
    console.log('');
    console.log(`The Publish failure occurs at: ${firstFailure.step}`);
    console.log('');
    
    const errorCode = firstFailure.error.code;
    const table = firstFailure.error.table;
    const constraint = firstFailure.error.constraint;
    
    if (errorCode === '23505') {
      console.log('PostgreSQL Error: UNIQUE VIOLATION');
      console.log(`Table: ${table}`);
      console.log(`Constraint: ${constraint}`);
      console.log('');
      console.log('This means a row with this external_id already exists,');
      console.log('but the UPSERT is failing to UPDATE it.');
    } else if (errorCode === '23503') {
      console.log('PostgreSQL Error: FOREIGN KEY VIOLATION');
      console.log(`Table: ${table}`);
      console.log(`Constraint: ${constraint}`);
      console.log('');
      console.log('This means a parent reference does not exist.');
    } else if (errorCode) {
      console.log(`PostgreSQL Error Code: ${errorCode}`);
      console.log(`Table: ${table}`);
      console.log(`Constraint: ${constraint}`);
    }
  } else {
    console.log('');
    console.log('============================================================');
    console.log('ALL SYNC STEPS SUCCEEDED ✅');
    console.log('============================================================');
    console.log('');
    console.log('MainDB reads: PASS');
    console.log('TutorialDB domain UPSERT: PASS');
    console.log('TutorialDB subject UPSERT: PASS');
    console.log('TutorialDB topic UPSERT: PASS');
    console.log('TutorialDB subtopic UPSERT: PASS');
    console.log('');
    console.log('The sync logic itself is NOT the problem.');
    console.log('');
    console.log('Possible causes:');
    console.log('1. Different database connection between test and production');
    console.log('2. Concurrent modification during production Publish');
    console.log('3. Additional validation/constraint in production API');
    console.log('4. Schema mismatch between environments');
    console.log('');
    console.log('NEXT STEP: Deploy Phase 11.18E instrumentation and capture');
    console.log('production publish attempt logs.');
  }

  console.log('');
  console.log('============================================================');
  console.log('SYNC STEP SUMMARY');
  console.log('============================================================');
  console.log('');
  
  const summary = syncSteps.reduce((acc, step) => {
    if (!acc[step.status]) {
      acc[step.status] = 0;
    }
    acc[step.status]++;
    return acc;
  }, {} as Record<string, number>);

  console.log(`START:   ${summary.START || 0}`);
  console.log(`SUCCESS: ${summary.SUCCESS || 0}`);
  console.log(`FAILED:  ${summary.FAILED || 0}`);
  console.log('');
}

void main();
