import { envPath } from '@quiz/config/envPaths';
import { db, domains, subjects } from '@quiz/db';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';

import { scriptLogger } from '../../scripts/logger';

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

        scriptLogger.info("--- SUBJECT COUNTS BY DOMAIN ---");
        counts.forEach(c => {
            scriptLogger.info(`${c.domainName}: ${c.subjectCount} subjects`);
        });

        // Write to file for reliable reading
        writeFileSync('subject-counts.json', JSON.stringify(counts, null, 2));
    } catch (e) {
        scriptLogger.error("Count query failed", e instanceof Error ? e.message : e);
    }
}

void checkCounts().catch((e) => {
    scriptLogger.error("Unexpected failure", e instanceof Error ? e.message : e);
    process.exit(1);
});
