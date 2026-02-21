import "dotenv/config";
import { PerformanceService } from "../apps/api-server/src/modules/report-engine/performance.service";

async function main() {
  const examId = '0a38074c-2113-4527-bc15-1cbfc1836cea';
  console.log(`Final Cache Flush for ${examId}...`);
  await PerformanceService.invalidateCache(examId);
  console.log("✅ Flush complete.");
  process.exit(0);
}

main().catch(console.error);
