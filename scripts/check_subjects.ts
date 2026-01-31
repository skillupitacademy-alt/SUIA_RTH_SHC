
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../packages/db/.env") });
import { db, domains, subjects } from "../packages/db/src";
import { eq } from "drizzle-orm";

async function main() {
    const allDomains = await db.query.domains.findMany({
        with: {
            subjects: true
        }
    });

    const targetDomain = allDomains.find(d => d.name === "Database Systems");
    let output = "";
    if (targetDomain) {
        output += `\n🎯 TARGET: Database Systems (ID: ${targetDomain.id})\n`;
        output += `Subjects Count: ${targetDomain.subjects.length}\n`;
        targetDomain.subjects.forEach(s => output += `  - ${s.name} (ID: ${s.id})\n`);
    } else {
        output += "\n❌ Domain 'Database Systems' NOT FOUND in DB.\n";
        output += "Available Domains: " + allDomains.map(d => d.name).join(", ");
    }
    fs.writeFileSync("subjects_check.txt", output);
    console.log("Check complete. See subjects_check.txt");
}

main().catch(console.error).then(() => process.exit(0));
