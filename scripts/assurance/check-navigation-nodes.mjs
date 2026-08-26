#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function checkNavigationNodes() {
  try {
    // Get the subtopic ID for 'What is Java?'
    const subtopic = await mainPool.query(`
      SELECT s.id, s.name, t.name as topic_name 
      FROM subtopics s
      JOIN topics t ON s.topic_id = t.id
      WHERE s.name ILIKE '%java%' AND t.name ILIKE '%java%'
      AND s.deleted_at IS NULL AND t.deleted_at IS NULL
      LIMIT 1
    `);
    
    if (subtopic.rows.length === 0) {
      console.log('❌ Subtopic "What is Java?" not found in main database');
      return false;
    }
    
    console.log('\n✅ Subtopic found in main database:');
    console.log(`   Name: ${subtopic.rows[0].name}`);
    console.log(`   ID: ${subtopic.rows[0].id}`);
    console.log(`   Topic: ${subtopic.rows[0].topic_name}\n`);
    
    // Check navigation nodes in tutorial database
    const navNodes = await tutorialPool.query(`
      SELECT id, name, subtopic_id 
      FROM navigation_nodes 
      WHERE subtopic_id = $1 AND deleted_at IS NULL
      ORDER BY sequence_order, name
      LIMIT 10
    `, [subtopic.rows[0].id]);
    
    if (navNodes.rows.length === 0) {
      console.log('❌ No navigation nodes found for this subtopic in tutorial database');
      console.log('   Browser tests require at least 3 navigation nodes\n');
      return false;
    }
    
    console.log(`✅ Navigation nodes found: ${navNodes.rows.length}`);
    navNodes.rows.forEach((n, i) => console.log(`   ${i+1}. ${n.name} (${n.id.substring(0, 8)}...)`));
    
    if (navNodes.rows.length >= 3) {
      console.log('\n✅ Sufficient navigation nodes for browser tests (need 3+)');
      return true;
    } else {
      console.log(`\n⚠️  Only ${navNodes.rows.length} navigation nodes found, need at least 3 for all tests`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await mainPool.end();
    await tutorialPool.end();
  }
}

console.log('='.repeat(60));
console.log('CHECKING NAVIGATION NODES FOR BROWSER TESTS');
console.log('='.repeat(60));

checkNavigationNodes().then((result) => {
  process.exitCode = result ? 0 : 1;
});
