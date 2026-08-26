import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('\n=== FINDING FULL STACK DEVELOPMENT HIERARCHY ===\n');

try {
  // Find Full Stack Development domain
  const domain = await pool.query(`
    SELECT id, name FROM domains 
    WHERE name ILIKE '%full%stack%' AND deleted_at IS NULL
    LIMIT 1
  `);
  
  if (domain.rows.length === 0) {
    console.log('Full Stack Development domain not found');
    await pool.end();
    process.exit(1);
  }
  
  console.log(`Domain: ${domain.rows[0].name}`);
  console.log(`  ID: ${domain.rows[0].id}\n`);
  
  // Get subjects for this domain
  const subjects = await pool.query(`
    SELECT id, name FROM subjects 
    WHERE domain_id = $1 AND deleted_at IS NULL
    ORDER BY name
  `, [domain.rows[0].id]);
  
  console.log(`Subjects (${subjects.rows.length}):`);
  subjects.rows.forEach((s, i) => console.log(`  ${i + 1}. ${s.name}`));
  console.log('');
  
  if (subjects.rows.length > 0) {
    // Find Backend Development subject
    const backendSubject = subjects.rows.find(s => s.name.includes('Backend'));
    const targetSubject = backendSubject || subjects.rows[0];
    
    // Get topics for Backend Development
    const topics = await pool.query(`
      SELECT id, name FROM topics 
      WHERE subject_id = $1 AND deleted_at IS NULL
      ORDER BY name
    `, [targetSubject.id]);
    
    console.log(`Topics for "${targetSubject.name}" (${topics.rows.length}):`);
    topics.rows.forEach((t, i) => console.log(`  ${i + 1}. ${t.name}`));
    console.log('');
    
    if (topics.rows.length > 0) {
      // Get subtopics for first topic
      const subtopics = await pool.query(`
        SELECT id, name FROM subtopics 
        WHERE topic_id = $1 AND deleted_at IS NULL
        ORDER BY name
      `, [topics.rows[0].id]);
      
      console.log(`Subtopics for "${topics.rows[0].name}" (${subtopics.rows.length}):`);
      subtopics.rows.forEach((st, i) => console.log(`  ${i + 1}. ${st.name}`));
      console.log('');
      
      if (subtopics.rows.length > 0) {
        // Get navigation nodes for first subtopic
        const navNodes = await pool.query(`
          SELECT id, name FROM navigation_nodes 
          WHERE subtopic_id = $1 AND deleted_at IS NULL
          ORDER BY sequence_order, name
          LIMIT 5
        `, [subtopics.rows[0].id]);
        
        console.log(`Navigation Nodes for "${subtopics.rows[0].name}" (${navNodes.rows.length}):`);
        navNodes.rows.forEach((nn, i) => console.log(`  ${i + 1}. ${nn.name} (${nn.id})`));
        console.log('');
        
        console.log('=== TEST PATH ===');
        console.log(`Domain: ${domain.rows[0].name}`);
        console.log(`Subject: ${targetSubject.name}`);
        console.log(`Topic: ${topics.rows[0].name}`);
        console.log(`Subtopic: ${subtopics.rows[0].name}`);
        if (navNodes.rows.length > 0) {
          console.log(`Navigation Nodes Available: ${navNodes.rows.length}`);
        }
      }
    }
  }
  
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
