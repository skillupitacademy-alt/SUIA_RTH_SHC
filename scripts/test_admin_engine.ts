
import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../packages/db/.env") });

import { AdminEngine } from "../apps/api-server/src/modules/admin-engine/admin.engine";

async function main() {
    scriptLogger.info("Testing AdminEngine.getSubjects...");
    try {
        const result = await AdminEngine.getSubjects(1, 10, { 
            domainId: "30000000-0000-0000-0000-000000000008" // Database Systems ID from previous check
        });
        scriptLogger.info("Success!");
        scriptLogger.info("Total:", (result as any).total);
        scriptLogger.info("First Subject:", (result as any).data[0]?.name);
    } catch (e: any) {
        scriptLogger.error("FAIL:", e);
        scriptLogger.error("Message:", e.message);
    }
}

main().catch(scriptLogger.error).then(() => process.exit(0));

