import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const sql = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

try {
  const sidebars = await sql.query(`
    SELECT 
      brand_id,
      topic_id,
      status,
      version,
      published_at,
      updated_at,
      created_at
    FROM tutorial_sidebar_trees_v2
    WHERE status = 'published'
    ORDER BY updated_at DESC
  `);

  console.log('\n=== PUBLISHED SIDEBARS ===');
  console.log('Count:', sidebars.rows.length);
  console.log('');
  
  sidebars.rows.forEach((row, i) => {
    console.log(`Sidebar ${i + 1}:`);
    console.log('  Brand:', row.brand_id);
    console.log('  Topic ID:', row.topic_id);
    console.log('  Status:', row.status);
    console.log('  Version:', row.version);
    console.log('  Published:', row.published_at);
    console.log('  Updated:', row.updated_at);
    console.log('');
  });

  // Check Java topic specifically
  const javaSidebar = await sql.query(`
    SELECT COUNT(*) as count
    FROM tutorial_sidebar_trees_v2
    WHERE topic_id = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07'
    AND status = 'published'
  `);

  console.log('=== JAVA TOPIC SIDEBAR ===');
  console.log('Topic ID: fb47747d-ac1c-4091-bd8e-a8a7d7378e07');
  console.log('Published count:', javaSidebar.rows[0].count);

  await sql.end();
} catch (error) {
  console.error('Error:', error.message);
  await sql.end();
  process.exit(1);
}
