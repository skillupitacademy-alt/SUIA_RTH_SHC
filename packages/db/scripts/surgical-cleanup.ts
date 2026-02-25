import { db, reports } from "../src";
import { inArray } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from the root of the db package
dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  const attemptIds = [
    "daefe3fe-1f0b-414d-9b30-bc759863af5b",
    "f7e45738-e2dd-46f3-9529-f532fb439e84",
    "6bfd54eb-7a05-413b-8b50-9e8b42e51f8c"
  ];

  console.log("--- STARTING SURGICAL CLEANUP ---");
  console.log(`Target attempts: ${attemptIds.length}`);

  try {
    const deleted = await db
      .delete(reports)
      .where(inArray(reports.attemptId, attemptIds))
      .returning({ id: reports.attemptId });

    console.log(`SUCCESS: Deleted ${deleted.length} records.`);
    console.log("Deleted IDs:", deleted.map(d => d.id));
  } catch (error) {
    console.error("CRITICAL_ERROR:", error);
  } finally {
    process.exit(0);
  }
}

main();
