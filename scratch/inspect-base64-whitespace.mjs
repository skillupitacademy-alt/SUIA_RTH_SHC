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
    
    console.log('Length of dataUri:', dataUri.length);
    console.log('Contains space?', dataUri.includes(' '));
    console.log('Contains newline (\\n)?', dataUri.includes('\n'));
    console.log('Contains carriage return (\\r)?', dataUri.includes('\r'));
    console.log('Contains tab (\\t)?', dataUri.includes('\t'));
    
    const matchesWhitespace = dataUri.match(/\s/);
    console.log('Has any whitespace matches?', !!matchesWhitespace);
    if (matchesWhitespace) {
      console.log('First whitespace match at index:', matchesWhitespace.index);
      console.log('Substring around first whitespace:', JSON.stringify(dataUri.slice(Math.max(0, matchesWhitespace.index - 10), matchesWhitespace.index + 10)));
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

main();
