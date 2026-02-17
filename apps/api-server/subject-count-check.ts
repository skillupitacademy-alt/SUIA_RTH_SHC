/* eslint-disable no-console */
import { envPath } from '@quiz/config/envPaths';
import { db, domains, subjects } from '@quiz/db';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';

dotenv.config({ path: envPath('packages/db/.env') });

async function checkCounts() {
    try {
        const counts = await db
            .select({
                domainName: domains.name,
                subjectCount: sql<number>`count(${subjects.id})`.mapWith(Number)
            })
            .from(domains)
            .leftJoin(subjects, sql`${domains.id} = ${subjects.domainId}`)
            .groupBy(domains.name);

        console.log("--- SUBJECT COUNTS BY DOMAIN ---");
        counts.forEach(c => {
            console.log(`${c.domainName}: ${c.subjectCount} subjects`);
        });

        // Write to file for reliable reading
        writeFileSync('subject-counts.json', JSON.stringify(counts, null, 2));
    } catch (e) {
        console.error("Count query failed:", e);
    }
}

void checkCounts().catch((e) => {
    console.error(e);
    process.exit(1);
});
