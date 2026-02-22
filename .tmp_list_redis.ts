import { Redis } from "@upstash/redis";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error('No Redis creds');
  process.exit(1);
}
const redis = new Redis({ url, token });

(async () => {
  const keys = await redis.keys('*');
  console.log('Keys:', keys);
  const samples = {};
  for (const k of keys.slice(0, 10)) {
    samples[k] = await redis.get(k);
  }
  console.log('Sample values:', JSON.stringify(samples, null, 2));
})();
