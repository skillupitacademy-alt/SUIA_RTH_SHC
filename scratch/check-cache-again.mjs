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
  
  if (val) {
    console.log('✅ Redis Cache Key Exists!');
    const notes = val.sections?.notes;
    console.log('Has notes in cache?', !!notes);
    console.log('notes.summaryCard keys:', Object.keys(notes?.summaryCard || {}));
    console.log('Has image in cached summaryCard?', !!notes?.summaryCard?.image);
    if (notes?.summaryCard?.image) {
      console.log('Image details in cache:', {
        alt: notes.summaryCard.image.alt,
        name: notes.summaryCard.image.name,
        type: notes.summaryCard.image.type,
        dataUriLength: notes.summaryCard.image.dataUri?.length
      });
    }
  } else {
    console.log('❌ Redis Cache Key Does NOT Exist!');
  }
}

main().catch(console.error);
