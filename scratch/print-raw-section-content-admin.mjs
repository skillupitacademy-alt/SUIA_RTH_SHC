import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';

neonConfig.webSocketConstructor = WebSocket;

// The exact connection string from Cloud Secret Manager
const connectionString = 'postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString });

async function main() {
  try {
    const res = await pool.query(`
      SELECT content FROM tutorial_sections WHERE id = '4ae9d132-2fda-4ed6-9464-93787ad81fd2'
    `);
    
    if (res.rows.length === 0) {
      console.log('❌ Section not found!');
      return;
    }
    
    const content = res.rows[0].content;
    console.log('Type of content:', typeof content);
    console.log('Does summaryCard exist inside raw content?', !!content?.summaryCard);
    console.log('Has image?', !!content?.summaryCard?.image);
    console.log('Raw summaryCard keys:', Object.keys(content?.summaryCard || {}));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

main();
