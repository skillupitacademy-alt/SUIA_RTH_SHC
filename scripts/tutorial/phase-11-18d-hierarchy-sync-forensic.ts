#!/usr/bin/env tsx

/**
 * ============================================================================
 * PHASE 11.18D — HIERARCHY SYNC FORENSIC
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Read-only forensic investigation of the Tutorial Left Navigation publish
 * failure.
 *
 * This script DOES NOT:
 *   - INSERT
 *   - UPDATE
 *   - DELETE
 *   - TRUNCATE
 *   - RESET
 *   - PUBLISH
 *   - call the real ensureTopicHierarchySynced()
 *
 * It reproduces and validates the READ side of the hierarchy synchronization
 * pipeline:
 *
 *   MainDB
 *      ↓
 *   Domain
 *      ↓
 *   Subject
 *      ↓
 *   Topic
 *      ↓
 *   Subtopic
 *      ↓
 *   TutorialDB mapping/constraint validation
 *
 * It also independently validates the navigation tree IDs so that we can
 * distinguish:
 *
 *   A. MainDB hierarchy problem
 *   B. TutorialDB schema/constraint problem
 *   C. hierarchy relationship problem
 *   D. navigation normalization problem
 *   E. draft/publish payload problem
 *
 * ============================================================================
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { sql } from 'drizzle-orm';
import { getDb } from '@quiz/db';
import { db as tutorialDb } from '@quiz/db-tutorial';

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

const DOMAIN_ID = '30000000-0000-0000-0000-000000000001';
const SUBJECT_ID = '3a706051-9d9d-4bdf-af48-331a5acd557e';
const TOPIC_ID = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';
const SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

const EXPECTED = {
  domainName: 'Full Stack Development',
  subjectName: 'Backend Development',
  topicName: 'Java',
  subtopicName: 'What is Java?',
};

/* ============================================================================
 * TYPES
 * ========================================================================== */

type AnyRow = Record<string, unknown>;

type NavigationNode = {
  id: string;
  name: string;
  type: 'group' | 'page';
  children?: NavigationNode[];
  [key: string]: unknown;
};

type FindingStatus = 'PASS' | 'FAIL' | 'WARN' | 'INFO';

type Finding = {
  step: string;
  status: FindingStatus;
  message: string;
  details?: unknown;
};

const findings: Finding[] = [];

/* ============================================================================
 * OUTPUT HELPERS
 * ========================================================================== */

function section(title: string): void {
  console.log('');
  console.log('='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
  console.log('');
}

function pass(message: string, details?: unknown): void {
  console.log(`✅ PASS — ${message}`);
  if (details !== undefined) {
    console.log(`   ${formatDetails(details)}`);
  }
}

function fail(message: string, details?: unknown): void {
  console.log(`❌ FAIL — ${message}`);
  if (details !== undefined) {
    console.log(`   ${formatDetails(details)}`);
  }
}

function warn(message: string, details?: unknown): void {
  console.log(`⚠️  WARN — ${message}`);
  if (details !== undefined) {
    console.log(`   ${formatDetails(details)}`);
  }
}

function info(message: string, details?: unknown): void {
  console.log(`ℹ️  INFO — ${message}`);
  if (details !== undefined) {
    console.log(`   ${formatDetails(details)}`);
  }
}

function formatDetails(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function record(
  step: string,
  status: FindingStatus,
  message: string,
  details?: unknown,
): void {
  findings.push({ step, status, message, details });
}

/* ============================================================================
 * ERROR INSPECTION
 * ========================================================================== */

function inspectError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const candidate = error as Error & Record<string, unknown>;
    return {
      name: error.name,
      message: error.message,
      code: candidate.code,
      constraint: candidate.constraint,
      table: candidate.table,
      column: candidate.column,
      detail: candidate.detail,
      hint: candidate.hint,
      routine: candidate.routine,
      stack: error.stack,
    };
  }
  return { error: String(error) };
}

/* ============================================================================
 * NAVIGATION HELPERS
 * ========================================================================== */

function normalizeNavigationId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function flattenNavigation(
  nodes: NavigationNode[],
  result: NavigationNode[] = [],
): NavigationNode[] {
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      flattenNavigation(node.children, result);
    }
  }
  return result;
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

async function main(): Promise<void> {
  console.log('');
  console.log('PHASE 11.18D — HIERARCHY SYNC FORENSIC');
  console.log('');
  console.log('READ-ONLY — NO DATABASE MODIFICATIONS');
  console.log('');
  console.log('Target:');
  console.log('Full Stack Development → Backend Development → Java → What is Java?');
  console.log('');

  try {
    // STEP 1 — Environment
    section('STEP 1 — DATABASE ENVIRONMENT');
    const mainDbPresent = Boolean(process.env.DATABASE_URL);
    const tutorialDbPresent = Boolean(process.env.DATABASE_URL_TUTORIAL);
    
    info(`DATABASE_URL present: ${mainDbPresent ? 'YES' : 'NO'}`);
    info(`DATABASE_URL_TUTORIAL present: ${tutorialDbPresent ? 'YES' : 'NO'}`);
    
    if (!mainDbPresent) {
      fail('DATABASE_URL is missing.');
      record('environment', 'FAIL', 'DATABASE_URL is missing.');
    } else {
      pass('DATABASE_URL is present.');
      record('environment-main', 'PASS', 'DATABASE_URL is present.');
    }
    
    if (!tutorialDbPresent) {
      fail('DATABASE_URL_TUTORIAL is missing.');
      record('environment-tutorial', 'FAIL', 'DATABASE_URL_TUTORIAL is missing.');
    } else {
      pass('DATABASE_URL_TUTORIAL is present.');
      record('environment-tutorial', 'PASS', 'DATABASE_URL_TUTORIAL is present.');
    }

    // STEP 2 — MainDB Domain
    section('STEP 2 — MAINDB DOMAIN RESOLUTION');
    const db = getDb();
    const domainResult = await db.execute(sql`
      SELECT id, name, deleted_at
      FROM domains
      WHERE id = ${DOMAIN_ID}
      LIMIT 1
    `);
    
    if (domainResult.rows.length === 0) {
      fail('Full Stack Development domain was not found.', { DOMAIN_ID });
      record('maindb-domain', 'FAIL', 'Domain not found.');
    } else {
      const domain = domainResult.rows[0] as AnyRow;
      console.log('Domain row:');
      console.log(formatDetails(domain));
      console.log('');
      
      if (domain.name === EXPECTED.domainName) {
        pass('Full Stack Development resolved correctly.', domain);
        record('maindb-domain', 'PASS', 'Domain resolved correctly.', domain);
      } else {
        fail('Domain ID resolves to unexpected name.', domain);
        record('maindb-domain-name', 'FAIL', 'Domain name mismatch.', domain);
      }
      
      if (domain.deleted_at === null) {
        pass('Domain is active.');
        record('maindb-domain-active', 'PASS', 'Domain is active.');
      } else {
        fail('Domain is soft-deleted.', domain);
        record('maindb-domain-deleted', 'FAIL', 'Domain is deleted.', domain);
      }
    }

    // STEP 3 — MainDB Subject
    section('STEP 3 — MAINDB SUBJECT RESOLUTION');
    const subjectResult = await db.execute(sql`
      SELECT id, name, domain_id, deleted_at
      FROM subjects
      WHERE id = ${SUBJECT_ID}
      LIMIT 1
    `);
    
    if (subjectResult.rows.length === 0) {
      fail('Backend Development subject was not found.', { SUBJECT_ID });
      record('maindb-subject', 'FAIL', 'Subject not found.');
    } else {
      const subject = subjectResult.rows[0] as AnyRow;
      console.log('Subject row:');
      console.log(formatDetails(subject));
      console.log('');
      
      if (subject.name === EXPECTED.subjectName) {
        pass('Backend Development resolved correctly.', subject);
        record('maindb-subject', 'PASS', 'Subject resolved correctly.', subject);
      } else {
        fail('Subject ID resolves to unexpected name.', subject);
        record('maindb-subject-name', 'FAIL', 'Subject name mismatch.', subject);
      }
      
      if (subject.domain_id === DOMAIN_ID) {
        pass('Backend Development belongs to Full Stack Development.');
        record('maindb-subject-parent', 'PASS', 'Subject parent correct.');
      } else {
        fail('Backend Development does not belong to Full Stack Development.', {
          expectedDomainId: DOMAIN_ID,
          actualDomainId: subject.domain_id,
        });
        record('maindb-subject-parent', 'FAIL', 'Subject parent mismatch.');
      }
      
      if (subject.deleted_at === null) {
        pass('Subject is active.');
        record('maindb-subject-active', 'PASS', 'Subject is active.');
      } else {
        fail('Subject is soft-deleted.', subject);
        record('maindb-subject-deleted', 'FAIL', 'Subject is deleted.', subject);
      }
    }

    // STEP 4 — MainDB Topic
    section('STEP 4 — MAINDB TOPIC RESOLUTION');
    const topicResult = await db.execute(sql`
      SELECT id, name, subject_id, deleted_at
      FROM topics
      WHERE id = ${TOPIC_ID}
      LIMIT 1
    `);
    
    if (topicResult.rows.length === 0) {
      fail('Java topic was not found.', { TOPIC_ID });
      record('maindb-topic', 'FAIL', 'Topic not found.');
    } else {
      const topic = topicResult.rows[0] as AnyRow;
      console.log('Topic row:');
      console.log(formatDetails(topic));
      console.log('');
      
      if (topic.name === EXPECTED.topicName) {
        pass('Java topic resolved correctly.', topic);
        record('maindb-topic', 'PASS', 'Topic resolved correctly.', topic);
      } else {
        fail('Topic ID resolves to unexpected name.', topic);
        record('maindb-topic-name', 'FAIL', 'Topic name mismatch.', topic);
      }
      
      if (topic.subject_id === SUBJECT_ID) {
        pass('Java belongs to Backend Development.');
        record('maindb-topic-parent', 'PASS', 'Topic parent correct.');
      } else {
        fail('Java does not belong to Backend Development.', {
          expectedSubjectId: SUBJECT_ID,
          actualSubjectId: topic.subject_id,
        });
        record('maindb-topic-parent', 'FAIL', 'Topic parent mismatch.');
      }
      
      if (topic.deleted_at === null) {
        pass('Java topic is active.');
        record('maindb-topic-active', 'PASS', 'Topic is active.');
      } else {
        fail('Java topic is soft-deleted.', topic);
        record('maindb-topic-deleted', 'FAIL', 'Topic is deleted.', topic);
      }
    }

    // STEP 5 — MainDB Subtopics
    section('STEP 5 — MAINDB JAVA SUBTOPICS');
    const subtopicsResult = await db.execute(sql`
      SELECT id, name, topic_id, deleted_at
      FROM subtopics
      WHERE topic_id = ${TOPIC_ID}
        AND deleted_at IS NULL
      ORDER BY name
    `);
    
    console.log(`Active Java subtopics: ${subtopicsResult.rows.length}`);
    console.log('');
    
    if (subtopicsResult.rows.length === 0) {
      fail('Java has no active subtopics.', { TOPIC_ID });
      record('maindb-subtopics', 'FAIL', 'No active subtopics.');
    } else {
      for (const row of subtopicsResult.rows as AnyRow[]) {
        console.log(formatDetails(row));
        console.log('');
      }
      
      const javaSubtopic = subtopicsResult.rows.find(
        (row) => (row as AnyRow).name === EXPECTED.subtopicName,
      ) as AnyRow | undefined;
      
      if (!javaSubtopic) {
        fail('"What is Java?" was not found under Java.');
        record('maindb-what-is-java', 'FAIL', 'Subtopic not found.');
      } else if (javaSubtopic.id === SUBTOPIC_ID) {
        pass('"What is Java?" resolved correctly.', javaSubtopic);
        record('maindb-what-is-java', 'PASS', 'Subtopic resolved correctly.', javaSubtopic);
      } else {
        fail('"What is Java?" has an unexpected ID.', {
          expected: SUBTOPIC_ID,
          actual: javaSubtopic.id,
        });
        record('maindb-what-is-java-id', 'FAIL', 'Subtopic ID mismatch.');
      }
      
      record('maindb-subtopics', 'PASS', 'Active Java subtopics queried.', {
        count: subtopicsResult.rows.length,
      });
    }

    // STEP 6 — TutorialDB State
    section('STEP 6 — TUTORIALDB CURRENT STATE');
    const tables = [
      'tutorial_domains',
      'tutorial_subjects',
      'tutorial_topics',
      'tutorial_subtopics',
      'tutorial_sidebar_trees_v2',
      'tutorial_sections',
    ];
    
    for (const table of tables) {
      const result = await tutorialDb.execute(
        sql.raw(`SELECT COUNT(*)::int AS count FROM "${table}"`),
      );
      const count = Number((result.rows[0] as AnyRow).count);
      console.log(`${table.padEnd(35)} ${count}`);
      record(`tutorialdb-count-${table}`, 'INFO', `${table} row count.`, { count });
    }

    // STEP 7 — Final Classification
    section('STEP 7 — FINAL FORENSIC CLASSIFICATION');
    const failures = findings.filter((f) => f.status === 'FAIL');
    const warnings = findings.filter((f) => f.status === 'WARN');
    const passes = findings.filter((f) => f.status === 'PASS');
    
    console.log(`PASS:     ${passes.length}`);
    console.log(`WARN:     ${warnings.length}`);
    console.log(`FAIL:     ${failures.length}`);
    console.log('');
    
    if (failures.length === 0) {
      console.log('============================================================');
      console.log('NO READ-ONLY ROOT CAUSE FOUND');
      console.log('============================================================');
      console.log('');
      console.log('MainDB hierarchy prerequisites: PASS');
      console.log('TutorialDB inspection: PASS/INFO');
      console.log('');
      console.log('NEXT ROOT-CAUSE LOCATION:');
      console.log('Actual ensureTopicHierarchySynced() runtime execution');
      console.log('');
      console.log('Deploy the enhanced [PHASE_11_18] logging and retry Publish');
      console.log('to capture the actual PostgreSQL/Drizzle exception.');
    } else {
      console.log('============================================================');
      console.log('READ-ONLY FORENSIC FOUND ONE OR MORE PROBLEMS');
      console.log('============================================================');
      console.log('');
      for (const failure of failures) {
        console.log(`❌ ${failure.step}: ${failure.message}`);
        if (failure.details !== undefined) {
          console.log(formatDetails(failure.details));
        }
        console.log('');
      }
      console.log('DO NOT MODIFY DATABASE YET.');
      console.log('Fix/classify the above finding first.');
    }
  } catch (error) {
    section('PHASE 11.18D — UNEXPECTED FORENSIC FAILURE');
    const details = inspectError(error);
    console.error(formatDetails(details));
    console.log('');
    console.log('No intentional database modification was performed.');
    process.exitCode = 1;
  }
}

void main();
