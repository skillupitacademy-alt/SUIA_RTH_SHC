import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('═══════════════════════════════════════════════════════════');
console.log('GATE 1: CURRENT DATABASE STATE AUDIT');
console.log('═══════════════════════════════════════════════════════════\n');

async function audit() {
  try {
    // 1. Check domains
    console.log('1. DOMAINS');
    console.log('─────────────────────────────────────────────────────────');
    const domains = await pool.query(`
      SELECT id, name, category 
      FROM domains 
      WHERE deleted_at IS NULL 
      ORDER BY name
    `);
    console.log(`Total domains: ${domains.rows.length}`);
    domains.rows.forEach(d => console.log(`  • ${d.name}`));
    
    // Check for "Full Stack Development"
    const fullStack = domains.rows.find(d => d.name === 'Full Stack Development');
    if (fullStack) {
      console.log(`\n✅ "Full Stack Development" EXISTS: ${fullStack.id}`);
      
      // 2. Check subjects under Full Stack
      console.log('\n2. SUBJECTS (under Full Stack Development)');
      console.log('─────────────────────────────────────────────────────────');
      const subjects = await pool.query(`
        SELECT id, name 
        FROM subjects 
        WHERE domain_id = $1 AND deleted_at IS NULL
        ORDER BY name
      `, [fullStack.id]);
      console.log(`Total subjects: ${subjects.rows.length}`);
      subjects.rows.forEach(s => console.log(`  • ${s.name}`));
      
      const backend = subjects.rows.find(s => s.name === 'Backend Development');
      if (backend) {
        console.log(`\n✅ "Backend Development" EXISTS: ${backend.id}`);
        
        // 3. Check topics under Backend
        console.log('\n3. TOPICS (under Backend Development)');
        console.log('─────────────────────────────────────────────────────────');
        const topics = await pool.query(`
          SELECT id, name 
          FROM topics 
          WHERE subject_id = $1 AND deleted_at IS NULL
          ORDER BY name
        `, [backend.id]);
        console.log(`Total topics: ${topics.rows.length}`);
        topics.rows.forEach(t => console.log(`  • ${t.name}`));
        
        const java = topics.rows.find(t => t.name === 'Java');
        if (java) {
          console.log(`\n✅ "Java" topic EXISTS: ${java.id}`);
          
          // 4. Check subtopics under Java
          console.log('\n4. SUBTOPICS (under Java)');
          console.log('─────────────────────────────────────────────────────────');
          const subtopics = await pool.query(`
            SELECT id, name 
            FROM subtopics 
            WHERE topic_id = $1 AND deleted_at IS NULL
            ORDER BY name
          `, [java.id]);
          console.log(`Total subtopics: ${subtopics.rows.length}`);
          subtopics.rows.forEach(st => console.log(`  • ${st.name}`));
        } else {
          console.log('\n❌ "Java" topic NOT FOUND');
        }
      } else {
        console.log('\n❌ "Backend Development" subject NOT FOUND');
      }
    } else {
      console.log('\n❌ "Full Stack Development" domain NOT FOUND');
    }
    
    // 5. Check tutorial_sidebar_trees_v2
    console.log('\n5. SIDEBAR TREES');
    console.log('─────────────────────────────────────────────────────────');
    const sidebars = await pool.query(`
      SELECT id, brand_id, topic_id, 
             jsonb_array_length(tree->'children') as node_count
      FROM tutorial_sidebar_trees_v2
    `);
    console.log(`Total sidebar trees: ${sidebars.rows.length}`);
    sidebars.rows.forEach(s => {
      console.log(`  • Brand: ${s.brand_id}, Topic: ${s.topic_id}, Nodes: ${s.node_count}`);
    });
    
    // 6. Check tutorial_sections
    console.log('\n6. TUTORIAL SECTIONS (content)');
    console.log('─────────────────────────────────────────────────────────');
    const sections = await pool.query(`
      SELECT COUNT(*) as total FROM tutorial_sections
    `);
    console.log(`Total sections: ${sections.rows[0].total}`);
    
    // 7. Check for specific navigation_node_id
    console.log('\n7. CONTENT FOR "what-is-java" PAGE');
    console.log('─────────────────────────────────────────────────────────');
    const whatIsJava = await pool.query(`
      SELECT COUNT(*) as total 
      FROM tutorial_sections 
      WHERE navigation_node_id = 'what-is-java'
    `);
    console.log(`Sections for "what-is-java": ${whatIsJava.rows[0].total}`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('AUDIT COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

audit();
