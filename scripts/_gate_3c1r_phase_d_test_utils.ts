/**
 * GATE 3C.1R — PHASE D: TEST UTILITIES
 * 
 * Shared helpers for Phase D lifecycle verification
 */

import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load environment BEFORE importing database
dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
});

import { db } from '../packages/db-tutorial/src/db';
import { LearningProgressService } from '../packages/db-tutorial/src/services/learning-progress.service';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';
import { TutorialNavigationProgressRepository } from '../packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository';
import { TutorialSectionRepository } from '../packages/db-tutorial/src/repositories/tutorial-section.repository';
import type { AuthenticatedIdentity } from '../packages/db-tutorial/src/services/learning-progress.types';
import type { BlockLearningState } from '../packages/db-tutorial/src/schema/block-learning-state';

export const TEST_PREFIX = 'gate-3c1r-phase-d';

// Known Phase C verified fixtures
export const KNOWN_USER_ID = '54726a2e-fca5-4d93-abc6-e7cee97a86f8';
export const KNOWN_NODE_ID = 'whatisjava';
export const KNOWN_SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
export const KNOWN_D1_BLOCK_ID = '79ae6e0f-0374-4dfe-8d76-cefbe42f8996';
export const KNOWN_C1_BLOCK_ID = 'fb6b1e9d-3fe2-48f5-891e-73f8e22797b9';

export const D1_VERSION = 'D1';
export const C1_VERSION = 'C1';
export const X1_VERSION = 'X1';

export const SESSION_A = 'gate-3c1r-phase-d-session-a';
export const SESSION_B = 'gate-3c1r-phase-d-session-b';
export const SESSION_C = 'gate-3c1r-phase-d-session-c';

export interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  error?: unknown;
}

export const results: TestResult[] = [];

export function pass(id: string, description: string, actual?: unknown): void {
  results.push({
    id,
    description,
    passed: true,
    actual,
  });

  console.log(`✅ PASS: ${id} — ${description}`);
}

export function fail(
  id: string,
  description: string,
  expected?: unknown,
  actual?: unknown,
  error?: unknown
): void {
  results.push({
    id,
    description,
    passed: false,
    expected,
    actual,
    error,
  });

  console.error(`❌ FAIL: ${id} — ${description}`);

  if (expected !== undefined) {
    console.error(`  Expected: ${JSON.stringify(expected)}`);
  }

  if (actual !== undefined) {
    console.error(`  Actual: ${JSON.stringify(actual)}`);
  }

  if (error !== undefined) {
    console.error(`  Error:`, error);
  }
}

export function assertEqual<T>(
  id: string,
  description: string,
  actual: T,
  expected: T
): void {
  if (actual === expected) {
    pass(id, description, actual);
    return;
  }

  fail(id, description, expected, actual);
}

export function assert(
  id: string,
  description: string,
  condition: boolean,
  expected = true,
  actual = condition
): void {
  if (condition) {
    pass(id, description, actual);
    return;
  }

  fail(id, description, expected, actual);
}

export function uniqueSession(suffix: string): string {
  return `${TEST_PREFIX}-${suffix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function uniqueBlockId(suffix: string): string {
  return `${TEST_PREFIX}-block-${suffix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function printSummary(groupName: string): void {
  const passed = results.filter(result => result.passed).length;
  const failed = results.filter(result => !result.passed).length;

  console.log('');
  console.log('='.repeat(80));
  console.log(`${groupName} — SUMMARY`);
  console.log('='.repeat(80));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${results.length}`);
  console.log('='.repeat(80));
  console.log('');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

/**
 * Create service with real repositories
 */
export function createService(): LearningProgressService {
  const progressRepo = new TutorialNavigationProgressRepository(db);
  const sectionRepo = new TutorialSectionRepository(db);
  const blockRepo = new BlockLearningStateRepository(db);
  return new LearningProgressService(progressRepo, sectionRepo, blockRepo);
}

/**
 * Create authenticated identity
 */
export function createIdentity(
  userId: string = KNOWN_USER_ID,
  brand: string = 'realtutorialhub'
): AuthenticatedIdentity {
  return {
    userId,
    brand,
  };
}

/**
 * Read block learning state from repository
 */
export async function readBlockState(
  repository: BlockLearningStateRepository,
  userId: string,
  navigationNodeId: string,
  blockId: string,
  blockVersion: string
): Promise<BlockLearningState | undefined> {
  const records = await repository.findByNavigationNode(userId, navigationNodeId);

  return records.find(
    record => record.blockId === blockId && record.blockVersion === blockVersion
  );
}

/**
 * Canonical Phase D scenario IDs
 */
export const PHASE_D_SCENARIOS = [
  'WR-1',
  'WR-2',
  'WR-3',
  'WR-4',
  'WR-5',
  'WR-6',
  'WR-7',
  'SS-1',
  'SS-2',
  'SS-3',
  'SS-4',
  'SS-5',
  'SS-6',
  'LE-1',
  'LE-2',
  'LE-3',
  'LE-4',
  'LE-5',
  'LE-6',
  'LE-7',
  'CS-1',
  'CS-2',
  'CS-3',
  'CS-4',
  'CS-5',
  'CS-6',
  'CS-7',
  'DC-1',
  'DC-2',
  'DC-3',
  'DC-4',
  'DC-5',
  'DC-6',
  'DC-7',
] as const;

// Verify count
if (PHASE_D_SCENARIOS.length !== 34) {
  throw new Error(
    `PHASE D SCENARIO COUNT MISMATCH: Expected 34, got ${PHASE_D_SCENARIOS.length}`
  );
}
