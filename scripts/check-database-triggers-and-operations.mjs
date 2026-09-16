#!/usr/bin/env node
/**
 * Check Database Triggers and Operations
 * 
 * Purpose: Identify any database triggers, constraints, or operations
 * that could have caused Java tutorial_sections deletion
 */

import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  
  try {
    await client.connect();
    console.log('DATABASE TRIGGERS AND OPERATIONS AUDIT');
    console.log('='.repeat(80));
    console.log('');

    // ========================================================================
    // CHECK 1: List triggers on tutorial_sections
    // ========================================================================
    console.log('CHECK 1: Triggers on tutorial_sections');
    console.log('-'.repeat(80));
    
    const sectionsTriggers = await client.query(`
      SELECT
        n.nspname AS schema_name,
        c.relname AS table_name,
        t.tgname AS trigger_name,
        pg_get_triggerdef(t.oid) AS trigger_definition,
        p.proname AS function_name
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE c.relname = 'tutorial_sections'
        AND NOT t.tgisinternal
    `);
    
    if (sectionsTriggers.rows.length === 0) {
      console.log('✓ NO user-defined triggers on tutorial_sections\n');
    } else {
      console.log(`Found ${sectionsTriggers.rows.length} trigger(s):\n`);
      sectionsTriggers.rows.forEach((trigger, idx) => {
        console.log(`${idx + 1}. ${trigger.trigger_name}`);
        console.log(`   Function: ${trigger.function_name}`);
        console.log(`   Definition: ${trigger.trigger_definition}`);
        console.log('');
      });
    }

    // ========================================================================
    // CHECK 2: List triggers on related tables
    // ========================================================================
    console.log('CHECK 2: Triggers on Related Tutorial Tables');
    console.log('-'.repeat(80));
    
    const relatedTriggers = await client.query(`
      SELECT
        n.nspname AS schema_name,
        c.relname AS table_name,
        t.tgname AS trigger_name,
        p.proname AS function_name
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE c.relname IN (
        'tutorial_sections',
        'tutorial_blocks',
        'tutorial_subtopics',
        'tutorial_navigation_progress'
      )
      AND NOT t.tgisinternal
    `);
    
    if (relatedTriggers.rows.length === 0) {
      console.log('✓ NO user-defined triggers on tutorial tables\n');
    } else {
      console.log(`Found ${relatedTriggers.rows.length} trigger(s):\n`);
      const byTable = {};
      relatedTriggers.rows.forEach(trigger => {
        if (!byTable[trigger.table_name]) byTable[trigger.table_name] = [];
        byTable[trigger.table_name].push(trigger);
      });
      
      Object.keys(byTable).forEach(table => {
        console.log(`Table: ${table}`);
        byTable[table].forEach(trigger => {
          console.log(`  - ${trigger.trigger_name} (${trigger.function_name})`);
        });
        console.log('');
      });
    }

    // ========================================================================
    // CHECK 3: Foreign key constraints with CASCADE
    // ========================================================================
    console.log('CHECK 3: Foreign Key Constraints with CASCADE Behavior');
    console.log('-'.repeat(80));
    
    const cascadeConstraints = await client.query(`
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS child_table,
        confrelid::regclass AS parent_table,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE contype = 'f'
        AND (
          conrelid::regclass::text ILIKE '%tutorial%'
          OR confrelid::regclass::text ILIKE '%tutorial%'
        )
        AND pg_get_constraintdef(oid) ILIKE '%CASCADE%'
    `);
    
    if (cascadeConstraints.rows.length === 0) {
      console.log('✓ NO CASCADE foreign keys found on tutorial tables\n');
    } else {
      console.log(`Found ${cascadeConstraints.rows.length} CASCADE constraint(s):\n`);
      cascadeConstraints.rows.forEach((constraint, idx) => {
        console.log(`${idx + 1}. ${constraint.constraint_name}`);
        console.log(`   ${constraint.child_table} → ${constraint.parent_table}`);
        console.log(`   ${constraint.constraint_definition}`);
        console.log('');
      });
    }

    // ========================================================================
    // CHECK 4: Event triggers (database-wide)
    // ========================================================================
    console.log('CHECK 4: Event Triggers (Database-Wide)');
    console.log('-'.repeat(80));
    
    const eventTriggers = await client.query(`
      SELECT
        evtname AS event_trigger_name,
        evtevent AS event_name,
        evtenabled AS enabled,
        evtfoid::regproc AS function_name
      FROM pg_event_trigger
    `);
    
    if (eventTriggers.rows.length === 0) {
      console.log('✓ NO event triggers defined\n');
    } else {
      console.log(`Found ${eventTriggers.rows.length} event trigger(s):\n`);
      eventTriggers.rows.forEach((trigger, idx) => {
        console.log(`${idx + 1}. ${trigger.event_trigger_name}`);
        console.log(`   Event: ${trigger.event_name}`);
        console.log(`   Enabled: ${trigger.enabled}`);
        console.log(`   Function: ${trigger.function_name}`);
        console.log('');
      });
    }

    // ========================================================================
    // CHECK 5: Database timezone and current time
    // ========================================================================
    console.log('CHECK 5: Database Timezone and Time Context');
    console.log('-'.repeat(80));
    
    const timeInfo = await client.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS current_schema,
        SHOW timezone AS timezone,
        NOW() AS database_now,
        CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS utc_now
    `);
    
    const timezone = await client.query(`SHOW timezone`);
    const now = await client.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS current_schema,
        NOW() AS database_now,
        CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS utc_now,
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata' AS india_now
    `);
    
    console.log(`Database: ${now.rows[0].database_name}`);
    console.log(`Schema: ${now.rows[0].current_schema}`);
    console.log(`Timezone: ${timezone.rows[0].timezone}`);
    console.log(`Database NOW: ${now.rows[0].database_now}`);
    console.log(`UTC NOW: ${now.rows[0].utc_now}`);
    console.log(`India NOW: ${now.rows[0].india_now}`);
    console.log('');

    // ========================================================================
    // CHECK 6: All foreign keys on tutorial_sections
    // ========================================================================
    console.log('CHECK 6: All Foreign Keys on tutorial_sections');
    console.log('-'.repeat(80));
    
    const allFKs = await client.query(`
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS child_table,
        confrelid::regclass AS parent_table,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE contype = 'f'
        AND conrelid::regclass::text = 'tutorial_sections'
    `);
    
    if (allFKs.rows.length === 0) {
      console.log('✓ NO foreign keys on tutorial_sections\n');
    } else {
      console.log(`Found ${allFKs.rows.length} foreign key(s):\n`);
      allFKs.rows.forEach((fk, idx) => {
        console.log(`${idx + 1}. ${fk.constraint_name}`);
        console.log(`   ${fk.child_table} → ${fk.parent_table}`);
        console.log(`   ${fk.constraint_definition}`);
        console.log('');
      });
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    
    const hasTriggers = sectionsTriggers.rows.length > 0 || relatedTriggers.rows.length > 0;
    const hasCascade = cascadeConstraints.rows.length > 0;
    const hasEventTriggers = eventTriggers.rows.length > 0;
    
    if (!hasTriggers && !hasCascade && !hasEventTriggers) {
      console.log('✅ NO DATABASE-LEVEL MECHANISMS FOUND');
      console.log('');
      console.log('The database has NO triggers, CASCADE deletes, or event triggers');
      console.log('that could automatically delete tutorial_sections rows.');
      console.log('');
      console.log('This confirms: Java tutorial_sections deletion was EXPLICIT');
      console.log('');
      console.log('Likely causes:');
      console.log('  1. Application code executed DELETE query');
      console.log('  2. Manual SQL execution');
      console.log('  3. Database reset/cleanup script');
      console.log('  4. Test fixture cleanup');
      console.log('  5. Migration script');
      
    } else {
      console.log('⚠️  DATABASE MECHANISMS DETECTED');
      console.log('');
      if (hasTriggers) {
        console.log('  ⚠️  User-defined triggers found');
      }
      if (hasCascade) {
        console.log('  ⚠️  CASCADE foreign keys found');
      }
      if (hasEventTriggers) {
        console.log('  ⚠️  Event triggers found');
      }
      console.log('');
      console.log('These mechanisms COULD have automatically deleted rows.');
      console.log('Review the detailed output above to assess each mechanism.');
    }
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
