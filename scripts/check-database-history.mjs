#!/usr/bin/env node
/**
 * Check Database Migration History and Metadata
 * 
 * Purpose: Identify any database operations that could explain Java content disappearance
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
    console.log('DATABASE HISTORY INVESTIGATION');
    console.log('='.repeat(80));
    console.log('');

    // ========================================================================
    // CHECK 1: Migration history
    // ========================================================================
    console.log('CHECK 1: Migration History');
    console.log('-'.repeat(80));
    
    // Check for drizzle migrations table
    const migrationTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%migration%' 
        OR table_name LIKE '%drizzle%'
        OR table_name = '__drizzle_migrations'
      )
    `);
    
    console.log('Migration-related tables:\n');
    if (migrationTables.rows.length === 0) {
      console.log('  (No migration tables found)');
    } else {
      migrationTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      
      // If __drizzle_migrations exists, query it
      const hasDrizzleTable = migrationTables.rows.some(r => r.table_name === '__drizzle_migrations');
      if (hasDrizzleTable) {
        console.log('');
        console.log('Recent migrations:');
        const migrations = await client.query(`
          SELECT id, hash, created_at
          FROM __drizzle_migrations
          ORDER BY created_at DESC
          LIMIT 10
        `);
        
        migrations.rows.forEach((m, idx) => {
          console.log(`  ${idx + 1}. ${m.created_at} - ${m.hash}`);
        });
      }
    }
    console.log('');

    // ========================================================================
    // CHECK 2: Database metadata
    // ========================================================================
    console.log('CHECK 2: Database Metadata');
    console.log('-'.repeat(80));
    
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as postgres_version,
        pg_database_size(current_database()) as database_size
    `);
    
    console.log('Current database:');
    console.log(`  Name: ${dbInfo.rows[0].database_name}`);
    console.log(`  User: ${dbInfo.rows[0].user_name}`);
    console.log(`  PostgreSQL: ${dbInfo.rows[0].postgres_version.split(',')[0]}`);
    console.log(`  Size: ${(parseInt(dbInfo.rows[0].database_size) / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    // ========================================================================
    // CHECK 3: Table creation times (if available)
    // ========================================================================
    console.log('CHECK 3: Tutorial Sections Table Metadata');
    console.log('-'.repeat(80));
    
    const tableInfo = await client.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables
      WHERE tablename = 'tutorial_sections'
    `);
    
    if (tableInfo.rows.length > 0) {
      const info = tableInfo.rows[0];
      console.log('tutorial_sections table:');
      console.log(`  Schema: ${info.schemaname}`);
      console.log(`  Owner: ${info.tableowner}`);
      console.log(`  Has indexes: ${info.hasindexes}`);
      console.log(`  Has triggers: ${info.hastriggers}`);
      console.log('');
      
      // Check for triggers that might delete data
      if (info.hastriggers) {
        const triggers = await client.query(`
          SELECT 
            trigger_name,
            event_manipulation,
            action_statement
          FROM information_schema.triggers
          WHERE event_object_table = 'tutorial_sections'
        `);
        
        if (triggers.rows.length > 0) {
          console.log('  Triggers on tutorial_sections:');
          triggers.rows.forEach(t => {
            console.log(`    - ${t.trigger_name} (${t.event_manipulation})`);
            console.log(`      ${t.action_statement.substring(0, 80)}...`);
          });
          console.log('');
        }
      }
    }

    // ========================================================================
    // CHECK 4: Row counts and data distribution
    // ========================================================================
    console.log('CHECK 4: Current Data Distribution');
    console.log('-'.repeat(80));
    
    const counts = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count,
        COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count,
        COUNT(DISTINCT subtopic_id) as unique_subtopics,
        COUNT(DISTINCT navigation_node_id) as unique_nav_nodes,
        MIN(created_at) as oldest_created,
        MAX(created_at) as newest_created,
        MAX(updated_at) as last_updated
      FROM tutorial_sections
    `);
    
    const stats = counts.rows[0];
    console.log('tutorial_sections statistics:');
    console.log(`  Active sections: ${stats.active_count}`);
    console.log(`  Deleted sections: ${stats.deleted_count}`);
    console.log(`  Unique subtopics: ${stats.unique_subtopics}`);
    console.log(`  Unique navigation nodes: ${stats.unique_nav_nodes}`);
    console.log(`  Oldest record: ${stats.oldest_created || 'N/A'}`);
    console.log(`  Newest record: ${stats.newest_created || 'N/A'}`);
    console.log(`  Last updated: ${stats.last_updated || 'N/A'}`);
    console.log('');

    // ========================================================================
    // CHECK 5: LSNB orphaned references
    // ========================================================================
    console.log('CHECK 5: Orphaned LSNB References');
    console.log('-'.repeat(80));
    
    const orphaned = await client.query(`
      SELECT
        p.navigation_node_id,
        p.section_id,
        p.visit_count,
        p.created_at as lsnb_created,
        p.updated_at as lsnb_updated,
        CASE 
          WHEN s.id IS NULL THEN 'ORPHANED'
          ELSE 'VALID'
        END as reference_status
      FROM tutorial_navigation_progress p
      LEFT JOIN tutorial_sections s ON s.id = p.section_id
      WHERE p.section_id IS NOT NULL
      ORDER BY reference_status, p.visit_count DESC
    `);
    
    const orphanedRefs = orphaned.rows.filter(r => r.reference_status === 'ORPHANED');
    const validRefs = orphaned.rows.filter(r => r.reference_status === 'VALID');
    
    console.log(`LSNB section references:`);
    console.log(`  Valid references: ${validRefs.length}`);
    console.log(`  Orphaned references: ${orphanedRefs.length}`);
    console.log('');
    
    if (orphanedRefs.length > 0) {
      console.log('Orphaned references (missing sections):');
      orphanedRefs.forEach((ref, idx) => {
        console.log(`  ${idx + 1}. Navigation: "${ref.navigation_node_id}"`);
        console.log(`     Missing Section ID: ${ref.section_id}`);
        console.log(`     Visits: ${ref.visit_count}`);
        console.log(`     LSNB Created: ${ref.lsnb_created}`);
        console.log(`     LSNB Updated: ${ref.lsnb_updated}`);
        console.log('');
      });
    }

    // ========================================================================
    // CHECK 6: Recent Python creation timeline
    // ========================================================================
    console.log('CHECK 6: Python Creation Timeline');
    console.log('-'.repeat(80));
    
    const pythonTimeline = await client.query(`
      SELECT
        created_at,
        updated_at,
        published_at,
        status,
        version
      FROM tutorial_sections
      WHERE navigation_node_id = 'whatispython'
    `);
    
    if (pythonTimeline.rows.length > 0) {
      const p = pythonTimeline.rows[0];
      console.log('Python section timeline:');
      console.log(`  Created:   ${p.created_at}`);
      console.log(`  Updated:   ${p.updated_at}`);
      console.log(`  Published: ${p.published_at || 'Never'}`);
      console.log(`  Status:    ${p.status}`);
      console.log(`  Version:   ${p.version}`);
      
      // Calculate time differences
      const createTime = new Date(p.created_at).getTime();
      const updateTime = new Date(p.updated_at).getTime();
      const timeDiff = (updateTime - createTime) / 1000;
      
      console.log('');
      console.log(`Time between create and update: ${timeDiff} seconds`);
      console.log(`Same day? ${new Date(p.created_at).toDateString() === new Date().toDateString()}`);
    }
    console.log('');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('INVESTIGATION SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    
    console.log('Key Findings:');
    console.log(`  1. Active tutorial sections in database: ${stats.active_count}`);
    console.log(`  2. Orphaned LSNB references: ${orphanedRefs.length}`);
    console.log(`  3. Database triggers on tutorial_sections: ${tableInfo.rows[0]?.hastriggers ? 'YES' : 'NO'}`);
    console.log('');
    
    console.log('Outstanding Questions:');
    console.log('  - When was Java section deleted? (no audit trail found)');
    console.log('  - What operation deleted it? (no evidence in normal code paths)');
    console.log('  - Was it a manual operation, test cleanup, or migration?');
    console.log('');
    
    console.log('Next Steps:');
    console.log('  → Check application logs for DELETE operations');
    console.log('  → Review test execution logs from yesterday');
    console.log('  → Check database backups for Java content');
    console.log('  → Interview team about recent database operations');
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
