#!/usr/bin/env node
/**
 * PHASE 3 E2E FORENSIC DIAGNOSIS
 * 
 * Purpose: Diagnose why Tutorial V2 resolver fails to find domain
 * 
 * Evidence needed:
 * 1. Which database contains the domain hierarchy?
 * 2. Does resolveHierarchy query the correct database?
 * 3. Why does ILS reject whatisjava for skillup brand?
 * 
 * NO MODIFICATIONS - EVIDENCE GATHERING ONLY
 */
import 'dotenv/config';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });

const { Client } = pkg;

console.log('\n═══════════════════════════════════════════════════════');
console.log('PHASE 3 E2E FORENSIC DIAGNOSIS');
console.log('═══════════════════════════════════════════════════════\n');

// Target hierarchy from E2E script
const TARGET = {
  domainSlug: 'full-stack-development-30000000',
  subjectSlug: 'backend-development-3a706051',
  topicSlug: 'java-4b21ddc0',
  subtopicSlug: 'what-is-java-12efacf1',
  navigationNodeId: 'whatisjava',
  subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
};

async function section(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(title);
  console.log('═'.repeat(60) + '\n');
}

async function checkDatabaseConnection(label, connectionString) {
  if (!connectionString) {
    console.log(`❌ ${label}: Connection string not defined\n`);
    return null;
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    const result = await client.query('SELECT current_database(), version()');
    console.log(`✅ ${label}: Connected`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   Connection: ${connectionString.substring(0, 50)}...\n`);
    return client;
  } catch (error) {
    console.log(`❌ ${label}: Connection failed`);
    console.log(`   Error: ${error.message}\n`);
    return null;
  }
}

async function queryDomainInDatabase(client, dbLabel) {
  console.log(`\n🔍 Querying ${dbLabel} for domain hierarchy...`);
  
  try {
    // Check if tutorial_domains exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_domains'
      ) as exists
    `);

    if (tableCheck.rows[0].exists) {
      console.log(`   ✅ tutorial_domains table exists`);
      
      const domainResult = await client.query(`
        SELECT id, name, slug, deleted_at
        FROM tutorial_domains
        WHERE deleted_at IS NULL
        ORDER BY name
      `);
      
      console.log(`   Found ${domainResult.rows.length} domains:`);
      domainResult.rows.forEach(d => {
        const isTarget = d.slug === TARGET.domainSlug;
        console.log(`   ${isTarget ? '👉' : '  '} ${d.name} (${d.slug})`);
      });

      const targetDomain = domainResult.rows.find(d => d.slug === TARGET.domainSlug);
      if (targetDomain) {
        console.log(`\n   ✅ TARGET DOMAIN FOUND: ${targetDomain.name}`);
        return targetDomain;
      } else {
        console.log(`\n   ❌ TARGET DOMAIN NOT FOUND: ${TARGET.domainSlug}`);
        return null;
      }
    } else {
      console.log(`   ⚠️  tutorial_domains table does NOT exist`);
      
      // Try domains table (curriculum DB)
      const domainCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'domains'
        ) as exists
      `);

      if (domainCheck.rows[0].exists) {
        console.log(`   ✅ domains table exists (curriculum DB)`);
        
        const domainResult = await client.query(`
          SELECT id, name, deleted_at
          FROM domains
          WHERE deleted_at IS NULL
          ORDER BY name
        `);
        
        console.log(`   Found ${domainResult.rows.length} domains:`);
        domainResult.rows.forEach(d => {
          console.log(`     - ${d.name}`);
        });
      } else {
        console.log(`   ❌ Neither tutorial_domains nor domains table exists`);
      }
      
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Query failed: ${error.message}`);
    return null;
  }
}

async function queryNavigationNodeMapping(client, dbLabel) {
  console.log(`\n🔍 Querying ${dbLabel} for navigation node brand mapping...`);
  
  try {
    const result = await client.query(`
      SELECT 
        ts.navigation_node_id,
        ts.subtopic_id,
        ts.brand_id,
        ts.status,
        st.name as subtopic_name,
        st.slug as subtopic_slug
      FROM tutorial_sections ts
      JOIN tutorial_subtopics st ON st.id = ts.subtopic_id
      WHERE ts.navigation_node_id = $1
        AND ts.deleted_at IS NULL
    `, [TARGET.navigationNodeId]);

    if (result.rows.length === 0) {
      console.log(`   ❌ No records found for navigationNodeId='${TARGET.navigationNodeId}'`);
      return null;
    }

    console.log(`   ✅ Found ${result.rows.length} record(s):`);
    result.rows.forEach(row => {
      console.log(`     - subtopicId: ${row.subtopic_id}`);
      console.log(`       subtopic: ${row.subtopic_name} (${row.subtopic_slug})`);
      console.log(`       brand_id: ${row.brand_id}`);
      console.log(`       status: ${row.status}`);
    });

    return result.rows;
  } catch (error) {
    console.log(`   ❌ Query failed: ${error.message}`);
    return null;
  }
}

async function main() {
  await section('TASK A: DATABASE CONNECTION VERIFICATION');

  const mainDb = await checkDatabaseConnection('DATABASE_URL (main)', process.env.DATABASE_URL);
  const tutorialDb = await checkDatabaseConnection('DATABASE_URL_TUTORIAL', process.env.DATABASE_URL_TUTORIAL);

  if (!mainDb && !tutorialDb) {
    console.log('\n❌ CRITICAL: No database connections available\n');
    process.exit(1);
  }

  await section('TASK B: DOMAIN RESOLUTION - WHERE IS THE DATA?');

  let domainFoundIn = null;

  if (mainDb) {
    const domain = await queryDomainInDatabase(mainDb, 'DATABASE_URL (main)');
    if (domain) {
      domainFoundIn = 'DATABASE_URL';
    }
  }

  if (tutorialDb) {
    const domain = await queryDomainInDatabase(tutorialDb, 'DATABASE_URL_TUTORIAL');
    if (domain) {
      domainFoundIn = domainFoundIn ? 'BOTH' : 'DATABASE_URL_TUTORIAL';
    }
  }

  await section('TASK C: ILS NAVIGATION NODE BRAND VALIDATION');

  if (tutorialDb) {
    const mappings = await queryNavigationNodeMapping(tutorialDb, 'DATABASE_URL_TUTORIAL');
    
    if (mappings) {
      console.log('\n📋 ILS Validation Analysis:');
      console.log(`   Request: navigationNodeId='${TARGET.navigationNodeId}', subtopicId='${TARGET.subtopicId}', brand='skillup'`);
      
      const matchingRecord = mappings.find(m => m.subtopic_id === TARGET.subtopicId);
      
      if (!matchingRecord) {
        console.log(`   ❌ FINDING: No record matches subtopicId='${TARGET.subtopicId}'`);
        console.log(`   This explains the ILS 400 error: "Navigation node does not belong to subtopic"`);
      } else if (matchingRecord.brand_id !== 'skillup' && matchingRecord.brand_id !== 'shared') {
        console.log(`   ❌ FINDING: Record exists but brand_id='${matchingRecord.brand_id}' (not 'skillup' or 'shared')`);
        console.log(`   This explains the ILS brand mismatch error`);
      } else {
        console.log(`   ✅ FINDING: Record exists with brand_id='${matchingRecord.brand_id}'`);
        console.log(`   ILS validation SHOULD pass - error may be in validation logic`);
      }
    }
  }

  await section('DIAGNOSTIC SUMMARY');

  console.log('KEY FINDINGS:\n');
  
  console.log(`1. Domain Hierarchy Location: ${domainFoundIn || 'NOT FOUND'}`);
  if (domainFoundIn === 'DATABASE_URL_TUTORIAL') {
    console.log(`   🔴 PROBLEM: resolveHierarchy() queries DATABASE_URL (main) via getDb()`);
    console.log(`   🔴 PROBLEM: But domain data is in DATABASE_URL_TUTORIAL`);
    console.log(`   🔴 IMPACT: Domain resolution fails → 15s timeout`);
  } else if (domainFoundIn === 'DATABASE_URL') {
    console.log(`   ✅ Domain is in DATABASE_URL (main) where resolver queries`);
  } else if (domainFoundIn === 'BOTH') {
    console.log(`   ⚠️  Domain exists in BOTH databases - may cause inconsistency`);
  }

  console.log('\n2. ILS Navigation Validation:');
  console.log(`   See analysis above`);

  console.log('\n3. E2E Test User ID:');
  console.log(`   🔴 PROBLEM: Test uses "test-e2e-user-id" (string)`);
  console.log(`   🔴 PROBLEM: PostgreSQL expects UUID`);
  console.log(`   🔴 FIX: Use authenticated userId from login response`);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  // Cleanup
  if (mainDb) await mainDb.end();
  if (tutorialDb) await tutorialDb.end();
}

main().catch((error) => {
  console.error('\n❌ DIAGNOSTIC ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
