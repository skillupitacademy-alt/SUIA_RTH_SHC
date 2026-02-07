
import { db, domains, subjects } from '../../packages/db/src/index';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../packages/db/.env') });

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
        const fs = require('fs');
        fs.writeFileSync('subject-counts.json', JSON.stringify(counts, null, 2));
    } catch (e) {
        console.error("Count query failed:", e);
    }
}

checkCounts().catch(console.error);
