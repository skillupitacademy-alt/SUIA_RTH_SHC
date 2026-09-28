/**
 * Query D1 Block Metadata
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Pool } = pg;

const tutorialPool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

try {
  // Get tutorial document with blocks
  const result = await tutorialPool.query(`
    SELECT 
      id,
      "navigationNodeId",
      blocks
    FROM tutorial_documents
    WHERE "navigationNodeId" = 'whatisjava'
  `);
  
  if (result.rows.length === 0) {
    console.log('No tutorial document found for whatisjava');
    process.exit(1);
  }
  
  const doc = result.rows[0];
  const d1Block = doc.blocks.find(b => b.id === '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749');
  
  if (!d1Block) {
    console.log('D1 block not found in document');
    console.log('Available blocks:', doc.blocks.map(b => ({ id: b.id, version: b.version })));
    process.exit(1);
  }
  
  console.log('D1 Block Metadata:');
  console.log(JSON.stringify({
    id: d1Block.id,
    version: d1Block.version,
    type: d1Block.type,
    progressRole: d1Block.progressRole,
    expectedTimeSec: d1Block.expectedTimeSec,
  }, null, 2));
  
} finally {
  await tutorialPool.end();
}
