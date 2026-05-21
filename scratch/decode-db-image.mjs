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
    const dataUri = content.summaryCard?.image?.dataUri;
    
    if (!dataUri) {
      console.log('No dataUri found');
      return;
    }
    
    const b64 = dataUri.slice('data:image/svg+xml;base64,'.length);
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    
    console.log('--- DECODED DB IMAGE CONTENT ---');
    console.log('Starts with <svg?', decoded.trimStart().startsWith('<svg'));
    console.log('Content preview:', decoded.slice(0, 500));
    
    try {
      const parsed = JSON.parse(decoded);
      console.log('Is valid JSON?', true);
      console.log('JSON keys:', Object.keys(parsed));
    } catch {
      console.log('Is valid JSON?', false);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

main();
