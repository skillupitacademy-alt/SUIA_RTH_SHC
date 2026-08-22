#!/usr/bin/env node
/**
 * Find "What is Java?" subtopic ID using direct SQL query
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('🔍 Finding "What is Java?" subtopic...\n');
  
  try {
    const result = await pool.query(`
      SELECT 
        st.id as subtopic_id,
        st.name as subtopic_name,
        st.description as subtopic_description,
        t.id as topic_id,
        t.name as topic_name,
        s.id as subject_id,
        s.name as subject_name,
        d.id as domain_id,
        d.name as domain_name
      FROM subtopics st
      JOIN topics t ON st.topic_id = t.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN domains d ON s.domain_id = d.id
      WHERE 
        d.name = 'Full Stack Development'
        AND s.name = 'Backend Development'
        AND t.name = 'Java'
        AND st.name ILIKE '%What is Java%'
        AND st.deleted_at IS NULL
      ORDER BY st.order ASC
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No matching subtopic found');
      console.log('\nTrying broader search for Java subtopics...\n');
      
      const broadResult = await pool.query(`
        SELECT 
          st.id as subtopic_id,
          st.name as subtopic_name,
          t.name as topic_name,
          s.name as subject_name,
          d.name as domain_name
        FROM subtopics st
        JOIN topics t ON st.topic_id = t.id
        JOIN subjects s ON t.subject_id = s.id
        JOIN domains d ON s.domain_id = d.id
        WHERE 
          t.name ILIKE '%Java%'
          AND st.deleted_at IS NULL
        ORDER BY d.name, s.name, t.name, st.order
        LIMIT 10
      `);
      
      if (broadResult.rows.length === 0) {
        console.log('❌ No Java-related subtopics found at all');
      } else {
        console.log(`Found ${broadResult.rows.length} Java-related subtopic(s):\n`);
        broadResult.rows.forEach((row, i) => {
          console.log(`${i + 1}. ${row.subtopic_name}`);
          console.log(`   Path: ${row.domain_name} > ${row.subject_name} > ${row.topic_name}`);
          console.log(`   ID: ${row.subtopic_id}\n`);
        });
      }
      
      process.exit(0);
    }
    
    console.log('✅ Found matching subtopic(s):\n');
    console.log('='.repeat(80));
    
    result.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. ${row.subtopic_name}`);
      console.log(`   Description: ${row.subtopic_description || 'N/A'}`);
      console.log(`   Path: ${row.domain_name} > ${row.subject_name} > ${row.topic_name}`);
      console.log(`   \n   IDs:`);
      console.log(`     Domain:   ${row.domain_id}`);
      console.log(`     Subject:  ${row.subject_id}`);
      console.log(`     Topic:    ${row.topic_id}`);
      console.log(`     Subtopic: ${row.subtopic_id}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ To use in test script:\n');
    console.log(`$env:JAVA_SUBTOPIC_ID="${result.rows[0].subtopic_id}"`);
    console.log('node scripts/test-with-real-java-subtopic.mjs\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
