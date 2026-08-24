import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

// Separate database connections
const mainDb = new Pool({ connectionString: process.env.DATABASE_URL });
const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('═══════════════════════════════════════════════════════════');
console.log('GATE 1: COMPLETE DATABASE STATE AUDIT');
console.log('═══════════════════════════════════════════════════════════\n');

async function audit() {
  try {
    // ═══════════════════════════════════════════════════════════
    // MAINDB AUDIT (Educational Hierarchy Authority)
    // ═══════════════════════════════════════════════════════════
    
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ MAINDB (DATABASE_URL)                                   │');
    console.log('│ Educational Hierarchy Authority                         │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    const fullStack = await mainDb.query(`
      SELECT id, name FROM domains WHERE name = 'Full Stack Development' AND deleted_at IS NULL
    `);
    
    if (fullStack.rows.length === 0) {
      console.log('❌ "Full Stack Development" domain NOT FOUND\n');
      return;
    }
    
    console.log('✅ Domain: Full Stack Development');
    console.log(`   ID: ${fullStack.rows[0].id}\n`);
    
    const backend = await mainDb.query(`
      SELECT id, name FROM subjects 
      WHERE domain_id = $1 AND name = 'Backend Development' AND deleted_at IS NULL
    `, [fullStack.rows[0].id]);
    
    if (backend.rows.length === 0) {
      console.log('❌ "Backend Development" subject NOT FOUND\n');
      return;
    }
    
    console.log('✅ Subject: Backend Development');
    console.log(`   ID: ${backend.rows[0].id}\n`);
    
    const java = await mainDb.query(`
      SELECT id, name FROM topics 
      WHERE subject_id = $1 AND name = 'Java' AND deleted_at IS NULL
    `, [backend.rows[0].id]);
    
    if (java.rows.length === 0) {
      console.log('❌ "Java" topic NOT FOUND\n');
      return;
    }
    
    console.log('✅ Topic: Java');
    console.log(`   ID: ${java.rows[0].id}\n`);
    
    const whatIsJava = await mainDb.query(`
      SELECT id, name FROM subtopics 
      WHERE topic_id = $1 AND name = 'What is Java?' AND deleted_at IS NULL
    `, [java.rows[0].id]);
    
    console.log(`Subtopics under Java: ${whatIsJava.rows.length}`);
    if (whatIsJava.rows.length > 0) {
      console.log('✅ Subtopic: What is Java?');
      console.log(`   ID: ${whatIsJava.rows[0].id}\n`);
    } else {
      console.log('❌ "What is Java?" subtopic NOT FOUND\n');
    }
    
    // ═══════════════════════════════════════════════════════════
    // TUTORIALDB AUDIT (Content + Sidebar)
    // ═══════════════════════════════════════════════════════════
    
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ TUTORIALDB (DATABASE_URL_TUTORIAL)                      │');
    console.log('│ Sidebar Trees + Content Sections                        │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    // Check sidebar trees
    console.log('SIDEBAR TREES');
    console.log('─────────────────────────────────────────────────────────');
    const sidebars = await tutorialDb.query(`
      SELECT id, brand_id, topic_id 
      FROM tutorial_sidebar_trees_v2
    `);
    console.log(`Total sidebar trees: ${sidebars.rows.length}\n`);
    
    if (sidebars.rows.length > 0) {
      for (const sidebar of sidebars.rows) {
        console.log(`  • Brand: ${sidebar.brand_id}`);
        console.log(`    Topic ID: ${sidebar.topic_id}`);
        
        // Check if this matches Java topic
        if (sidebar.topic_id === java.rows[0].id) {
          console.log('    ✅ MATCHES Java topic from MainDB!');
          
          // Get the actual tree structure
          const tree = await tutorialDb.query(`
            SELECT tree FROM tutorial_sidebar_trees_v2 WHERE id = $1
          `, [sidebar.id]);
          
          const nodes = tree.rows[0].tree;
          
          // Look for "what-is-java" page
          function findPage(node, targetId) {
            if (node.id === targetId && node.type === 'page') {
              return node;
            }
            if (node.children) {
              for (const child of node.children) {
                const found = findPage(child, targetId);
                if (found) return found;
              }
            }
            return null;
          }
          
          const whatIsJavaPage = findPage(nodes, 'what-is-java');
          if (whatIsJavaPage) {
            console.log('    ✅ Found page: "what-is-java"');
            console.log(`       Name: ${whatIsJavaPage.name}`);
            console.log(`       Type: ${whatIsJavaPage.type}`);
          } else {
            console.log('    ⚠️  Page "what-is-java" NOT FOUND in sidebar tree');
          }
        }
        console.log('');
      }
    }
    
    // Check tutorial_sections schema
    console.log('TUTORIAL_SECTIONS SCHEMA');
    console.log('─────────────────────────────────────────────────────────');
    const schema = await tutorialDb.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sections'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    schema.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  • ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`);
    });
    
    const hasNavigationNodeId = schema.rows.some(col => col.column_name === 'navigation_node_id');
    console.log('');
    if (hasNavigationNodeId) {
      console.log('✅ Column "navigation_node_id" EXISTS');
    } else {
      console.log('❌ Column "navigation_node_id" MISSING');
    }
    console.log('');
    
    // Check indexes/constraints
    console.log('TUTORIAL_SECTIONS INDEXES');
    console.log('─────────────────────────────────────────────────────────');
    const indexes = await tutorialDb.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'tutorial_sections'
    `);
    
    if (indexes.rows.length > 0) {
      indexes.rows.forEach(idx => {
        console.log(`  • ${idx.indexname}`);
        console.log(`    ${idx.indexdef}`);
        console.log('');
      });
    } else {
      console.log('  No indexes found\n');
    }
    
    // Check content
    console.log('TUTORIAL CONTENT');
    console.log('─────────────────────────────────────────────────────────');
    const totalSections = await tutorialDb.query(`
      SELECT COUNT(*) as total FROM tutorial_sections
    `);
    console.log(`Total sections: ${totalSections.rows[0].total}`);
    
    if (hasNavigationNodeId) {
      const whatIsJavaSections = await tutorialDb.query(`
        SELECT COUNT(*) as total 
        FROM tutorial_sections 
        WHERE navigation_node_id = 'what-is-java'
      `);
      console.log(`Sections for "what-is-java": ${whatIsJavaSections.rows[0].total}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('GATE 1 AUDIT COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mainDb.end();
    await tutorialDb.end();
  }
}

audit();
