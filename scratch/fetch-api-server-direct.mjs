import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const apiBase = 'https://quiz-api-server-581488566988.asia-southeast1.run.app/api';
  const internalSecret = process.env.INTERNAL_API_SECRET;
  
  const url = `${apiBase}/tutorial/sections/whatisjavascript?sectionType=notes`;
  console.log('🌐 Fetching directly from Central API Server:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Brand': 'realtutorialhub',
      'X-Internal-Secret': internalSecret || '',
    },
  });

  console.log('Status:', response.status);
  const data = await response.json();
  
  console.log('--- DIRECT API SERVER RESPONSE (summaryCard) ---');
  console.log(JSON.stringify(data?.content?.summaryCard, null, 2));
}

main().catch(console.error);
