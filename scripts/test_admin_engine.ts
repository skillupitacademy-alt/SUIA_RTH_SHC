
import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../packages/db/.env") });

import { AdminEngine } from "../apps/api-server/src/modules/admin-engine/admin.engine";

async function main() {
    console.log("Testing AdminEngine.getSubjects...");
    try {
        const result = await AdminEngine.getSubjects(1, 10, { 
            domainId: "30000000-0000-0000-0000-000000000008" // Database Systems ID from previous check
        });
        console.log("Success!");
        console.log("Total:", result.total);
        console.log("First Subject:", result.data[0]?.name);
    } catch (e: any) {
        console.error("FAIL:", e);
        console.error("Message:", e.message);
    }
}

main().catch(console.error).then(() => process.exit(0));
