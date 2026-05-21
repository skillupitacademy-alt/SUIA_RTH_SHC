import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';

neonConfig.webSocketConstructor = WebSocket;

const connectionString = 'postgresql://tutorial_admin:TutorialPlatform@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString });

async function main() {
  try {
    const res = await pool.query(`
      SELECT content FROM tutorial_sections WHERE id = '4ae9d132-2fda-4ed6-9464-93787ad81fd2'
    `);
    
    const content = res.rows[0].content;
    console.log('--- DB content.summaryCard ---');
    console.log(JSON.stringify(content.summaryCard, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

main();
