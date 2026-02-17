import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { db } from "@quiz/db";
import { domains, skills, subjects, topics } from "@quiz/db/schema/domain";
import { like, or, eq } from "drizzle-orm";

async function main() {
    console.log("🧹 Starting cleanup of dummy data...");

    // 1. Delete Skills
    const skillsResult = await db.delete(skills)
        .where(like(skills.name, 'TEST_SKILL_%'))
        .returning({ name: skills.name });
    console.log(`✅ Deleted ${skillsResult.length} dummy skills.`);

    // 2. Delete Topics
    const topicsResult = await db.delete(topics)
        .where(eq(topics.name, 'TEST_TOPIC'))
        .returning({ name: topics.name });
    console.log(`✅ Deleted ${topicsResult.length} dummy topics.`);

    // 3. Delete Subjects
    const subjectsResult = await db.delete(subjects)
        .where(eq(subjects.name, 'TEST_SUBJECT'))
        .returning({ name: subjects.name });
    console.log(`✅ Deleted ${subjectsResult.length} dummy subjects.`);

    // 4. Delete Domains
    const domainsResult = await db.delete(domains)
        .where(like(domains.name, 'TEST_DOMAIN_%'))
        .returning({ name: domains.name });
    console.log(`✅ Deleted ${domainsResult.length} dummy domains.`);

    console.log("🎉 Cleanup complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
});
