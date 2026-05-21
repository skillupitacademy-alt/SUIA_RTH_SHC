import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function main() {
  const key = 'tutorial:v2:sections:whatisjavascript:simple';
  const val = await redis.get(key);
  
  if (!val) {
    console.log(`❌ Key ${key} does not exist in Redis!`);
    return;
  }
  
  console.log(`✅ Key ${key} exists in Redis!`);
  const notes = val.sections?.notes;
  console.log('Does cached notes have summaryCard?', !!notes?.summaryCard);
  if (notes?.summaryCard) {
    console.log('summaryCard fields in cache:', Object.keys(notes.summaryCard));
    console.log('image field in cache:', notes.summaryCard.image);
  }
}

main().catch(console.error);
