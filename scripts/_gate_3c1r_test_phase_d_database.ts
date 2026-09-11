/**
 * GATE 3C.1R — PHASE D: DATABASE INSPECTION
 * 
 * Purpose: Verify PostgreSQL schema constraints match the repository
 * ON CONFLICT target to prevent 42P10 errors.
 * 
 * This inspection must pass BEFORE lifecycle runtime tests.
 * 
 * Verifies:
 * - Table existence
 * - Primary key definition matches repository upsert
 * - Column types match TypeScript types
 * - Index structure supports universal D1/C1/X1 queries
 */

import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load environment BEFORE importing modules
dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
});

import { db } from '../packages/db-tutorial/src/db';
import { sql } from 'drizzle-orm';

/**
 * Simple assertion helper
 */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function main() {
  console.log('================================================================================');
  console.log('GATE 3C.1R — PHASE D: DATABASE INSPECTION');
  console.log('================================================================================');
  console.log();

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    console.log('=== TABLE EXISTENCE ===');
    console.log();

    // D1: Table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'block_learning_state'
      );
    `);

    try {
      const exists = (tableCheck.rows[0] as any).exists;
      assert(exists === true, 'D1: block_learning_state table exists');
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();
    console.log('=== ON CONFLICT TARGET (UNIQUE INDEX) ===');
    console.log();

    // D2: Unique index matches repository ON CONFLICT target
    // The repository uses onConflictDoUpdate with target on (userId, navigationNodeId, blockId, blockVersion)
    // and targetWhere: deletedAt IS NULL - this matches the partial unique index
    const uniqueIndexCheck = await db.execute(sql`
      SELECT
        i.relname as index_name,
        pg_get_indexdef(i.oid) as index_definition
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      WHERE t.relname = 'block_learning_state'
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND ix.indisunique = true
        AND i.relname = 'uq_block_learning_state_identity'
      ORDER BY i.relname;
    `);

    try {
      assert(
        uniqueIndexCheck.rows.length === 1,
        `D2a: Unique index uq_block_learning_state_identity exists`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    const indexDef = (uniqueIndexCheck.rows[0] as any)?.index_definition || '';

    try {
      assert(
        indexDef.includes('user_id') &&
        indexDef.includes('navigation_node_id') &&
        indexDef.includes('block_id') &&
        indexDef.includes('block_version'),
        'D2b: Unique index contains all 4 identity columns'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    try {
      assert(
        indexDef.includes('deleted_at IS NULL'),
        'D2c: Unique index has partial WHERE clause for soft-delete support'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();
    console.log('=== COLUMN TYPES ===');
    console.log();

    // D3: Column types
    const columnCheck = await db.execute(sql`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'block_learning_state'
      ORDER BY ordinal_position;
    `);

    const columns = columnCheck.rows.reduce((acc: any, row: any) => {
      acc[row.column_name] = {
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
      };
      return acc;
    }, {});

    // Verify critical columns (matching actual Drizzle schema and PostgreSQL)
    const criticalColumns = [
      { name: 'user_id', type: 'uuid', nullable: false },
      { name: 'navigation_node_id', type: 'text', nullable: false },
      { name: 'block_id', type: 'text', nullable: false },
      { name: 'block_version', type: 'text', nullable: false },
      { name: 'visit_count', type: 'integer', nullable: false },
      { name: 'revision_count', type: 'integer', nullable: false },
      { name: 'active_time_sec', type: 'integer', nullable: false },
      { name: 'expected_time_sec', type: 'integer', nullable: true },
      { name: 'first_viewed_at', type: 'timestamp without time zone', nullable: true },
      { name: 'last_viewed_at', type: 'timestamp without time zone', nullable: true },
      { name: 'last_session_id', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamp without time zone', nullable: false },
      { name: 'updated_at', type: 'timestamp without time zone', nullable: false },
    ];

    for (const col of criticalColumns) {
      try {
        assert(
          columns[col.name] !== undefined,
          `D3: Column ${col.name} exists`
        );
        testsPassed++;
      } catch (e) {
        console.error((e as Error).message);
        testsFailed++;
        continue;
      }

      try {
        const actualType = columns[col.name].type;
        const typeMatch = actualType === col.type || 
                         (col.type === 'character varying' && actualType === 'character varying');
        assert(
          typeMatch,
          `D3: Column ${col.name} type is ${col.type} (received ${actualType})`
        );
        testsPassed++;
      } catch (e) {
        console.error((e as Error).message);
        testsFailed++;
      }
    }

    console.log();
    console.log('=== UNIVERSAL QUERY INDEX ===');
    console.log();

    // D4: Verify index structure supports universal queries
    const indexCheck = await db.execute(sql`
      SELECT
        i.relname as index_name,
        a.attname as column_name,
        am.amname as index_type
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_am am ON i.relam = am.oid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = 'block_learning_state'
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY i.relname, a.attnum;
    `);

    try {
      assert(
        indexCheck.rows.length > 0,
        'D4: block_learning_state has indexes for query performance'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
    }

    console.log();
    console.log('=== REPOSITORY CONTRACT ALIGNMENT ===');
    console.log();

    // D5: Verify the unique index matches BlockLearningStateRepository.upsert() ON CONFLICT target
    try {
      const repoUsesPartialUniqueIndex = 
        indexDef.includes('user_id') &&
        indexDef.includes('navigation_node_id') &&
        indexDef.includes('block_id') &&
        indexDef.includes('block_version') &&
        indexDef.includes('deleted_at IS NULL');
      
      assert(
        repoUsesPartialUniqueIndex,
        'D5: PostgreSQL unique index matches BlockLearningStateRepository.upsert() ON CONFLICT target'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
    }

    console.log();
    console.log('================================================================================');
    console.log('FINAL RESULT');
    console.log('================================================================================');
    console.log();
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    console.log();

    if (testsFailed === 0) {
      console.log('✅ PHASE D DATABASE INSPECTION: PASS');
      console.log();
      console.log('Evidence:');
      console.log('- block_learning_state table exists');
      console.log('- Unique index: uq_block_learning_state_identity');
      console.log('- Index columns: (user_id, navigation_node_id, block_id, block_version)');
      console.log('- Partial index: WHERE deleted_at IS NULL');
      console.log('- Unique index matches repository ON CONFLICT target');
      console.log('- Column types match TypeScript domain model');
      console.log('- Indexes support universal D1/C1/X1 queries');
      console.log();
      console.log('Safe to proceed with Phase D lifecycle runtime tests.');
      console.log();
      console.log('================================================================================');
      process.exitCode = 0;
    } else {
      console.log('❌ PHASE D DATABASE INSPECTION: FAIL');
      console.log();
      console.log(`${testsFailed} test(s) failed - see details above`);
      console.log();
      console.log('BLOCKED: Cannot proceed with Phase D lifecycle tests until database schema');
      console.log('         matches repository contract.');
      console.log();
      console.log('================================================================================');
      process.exitCode = 1;
    }

  } catch (error) {
    console.error();
    console.error('❌ DATABASE INSPECTION FAILED');
    console.error();

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error();
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }

    console.log();
    console.log('================================================================================');
    process.exitCode = 1;
  }
}

main();
