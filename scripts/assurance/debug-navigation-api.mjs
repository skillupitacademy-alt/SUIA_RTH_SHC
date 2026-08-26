#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const tutorialPool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL
});

const subtopicId = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

console.log('\n=== DEBUGGING NAVIGATION API ===\n');
console.log('Looking for subtopicId:', subtopicId);

try {
  // Check if subtopic exists by external_id
  const byExternalId = await tutorialPool.query(`
    SELECT id, external_id, topic_id, name 
    FROM tutorial_subtopics 
    WHERE external_id = $1
  `, [subtopicId]);
  
  console.log('\nQuery by external_id:');
  console.log('Rows found:', byExternalId.rows.length);
  if (byExternalId.rows.length > 0) {
    console.log(JSON.stringify(byExternalId.rows[0], null, 2));
    
    const subtopic = byExternalId.rows[0];
    
    // Check for ANY sidebar tree for this topic
    const allTrees = await tutorialPool.query(`
      SELECT id, topic_id, active_subtopic_id, brand_id, status, version
      FROM tutorial_sidebar_trees_v2
      WHERE topic_id = $1
      ORDER BY version DESC
    `, [subtopic.topic_id]);
    
    console.log('\nAll sidebar trees for topic_id:', subtopic.topic_id);
    console.log('Rows found:', allTrees.rows.length);
    allTrees.rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
  }
  
} catch (error) {
  console.error('\nError:', error.message);
} finally {
  await tutorialPool.end();
}
