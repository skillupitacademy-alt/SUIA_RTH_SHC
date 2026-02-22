
import { Redis } from "@upstash/redis";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from the root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function clearRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error("❌ Redis credentials not found in .env");
    process.exit(1);
  }

  const redis = new Redis({
    url,
    token,
  });

  try {
    console.log("🧹 Clearing Redis cache...");
    await redis.flushdb();
    console.log("✅ Redis cache cleared successfully!");
  } catch (error) {
    console.error("❌ Failed to clear Redis cache:", error);
  }
}

clearRedis();
