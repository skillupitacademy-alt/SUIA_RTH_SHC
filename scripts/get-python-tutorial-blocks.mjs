import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment
dotenv.config({ path: '.env.local' });

// Remove quotes if present
let connectionString = process.env.DATABASE_URL_TUTORIAL;
if (connectionString && connectionString.startsWith('"') && connectionString.endsWith('"')) {
  connectionString = connectionString.slice(1, -1);
}

const pool = new Pool({ connectionString });

async function getPythonTutorialBlocks() {
  // Check Java tutorial (whatisjava)
  const result = await pool.query(`
    SELECT 
      id,
      navigation_node_id,
      subtopic_id,
      status,
      content
    FROM tutorial_sections
    WHERE navigation_node_id = 'whatisjava'
      AND status = 'deployed'
    LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    console.log('❌ No published whatisjava tutorial found');
    process.exit(1);
  }
  
  const section = result.rows[0];
  const doc = section.content;
  
  console.log('\n📄 TUTORIAL DOCUMENT');
  console.log('═'.repeat(70));
  console.log('Section ID:', section.id);
  console.log('Navigation Node ID:', section.navigation_node_id);
  console.log('Subtopic ID:', section.subtopic_id);
  console.log('Status:', section.status);
  
  if (!doc || !doc.blocks) {
    console.log('\n❌ No blocks in published document');
    process.exit(1);
  }
  
  console.log('\n📦 BLOCKS (' + doc.blocks.length + ' total)');
  console.log('═'.repeat(70));
  
  const instructionalBlocks = [];
  
  doc.blocks.forEach((block, idx) => {
    const explicitProgressRole = block.progressRole;
    const resolvedProgressRole = block.progressRole ?? 'instructional'; // Resolver default
    const expectedTimeSec = block.expectedTimeSec;
    const version = block.version || 'unversioned';
    
    console.log(`\n[${idx}] ${block.type.toUpperCase()}`);
    console.log('─'.repeat(70));
    console.log('  Block ID:', block.id);
    console.log('  Type:', block.type);
    console.log('  Version:', version);
    console.log('  Progress Role (explicit):', explicitProgressRole || 'undefined');
    console.log('  Progress Role (resolved):', resolvedProgressRole);
    console.log('  Expected Time (sec):', expectedTimeSec !== undefined ? expectedTimeSec : 'null');
    
    if (resolvedProgressRole === 'instructional' && expectedTimeSec) {
      instructionalBlocks.push({
        id: block.id,
        type: block.type,
        version,
        expectedTimeSec,
        index: idx,
        navigationNodeId: section.navigation_node_id,
        subtopicId: section.subtopic_id
      });
    }
  });
  
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('🎯 INSTRUCTIONAL BLOCKS (via resolver default)');
  console.log('═'.repeat(70));
  
  if (instructionalBlocks.length === 0) {
    console.log('❌ No blocks with expectedTimeSec found');
    process.exit(1);
  }
  
  instructionalBlocks.forEach((block, idx) => {
    console.log(`\n[${idx}] E2E Test Candidate:`);
    console.log('  Navigation Node ID:', block.navigationNodeId);
    console.log('  Subtopic ID:', block.subtopicId);
    console.log('  Block ID:', block.id);
    console.log('  Type:', block.type);
    console.log('  Version:', block.version);
    console.log('  Expected Time:', block.expectedTimeSec, 'seconds');
    console.log('  80% Threshold:', Math.floor(block.expectedTimeSec * 0.8), 'seconds');
    
    if (block.expectedTimeSec <= 60) {
      console.log('  ✅ SUITABLE: Fast enough for E2E testing');
    } else if (block.expectedTimeSec <= 300) {
      console.log('  ⚠️  MARGINAL: May be slow for E2E');
    } else {
      console.log('  ❌ TOO SLOW: Not practical for E2E');
    }
  });
  
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(70));
  console.log('Total blocks:', doc.blocks.length);
  console.log('Instructional blocks (resolved):', instructionalBlocks.length);
  console.log('Fastest block:', Math.min(...instructionalBlocks.map(b => b.expectedTimeSec)), 'seconds');
  console.log('Slowest block:', Math.max(...instructionalBlocks.map(b => b.expectedTimeSec)), 'seconds');
  console.log('═'.repeat(70));
}

getPythonTutorialBlocks()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    pool.end();
    process.exit(1);
  });
