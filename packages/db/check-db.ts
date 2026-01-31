
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './src/schema/exam';
import * as domainSchema from './src/schema/domain';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function check() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const db = drizzle(pool, { schema: { ...schema, ...domainSchema } });

    console.log("Checking exam_blueprints...");
    const blueprints = await db.select().from(schema.examBlueprints);
    console.log(`Found ${blueprints.length} blueprints.`);
    blueprints.forEach(b => {
        console.log(`- ID: ${b.id}, Name: ${b.name}, Domains: ${JSON.stringify(b.domains)}`);
    });

    console.log("\nChecking domains...");
    const domains = await db.select().from(domainSchema.domains);
    console.log(`Found ${domains.length} domains.`);
    domains.forEach(d => {
        console.log(`- ID: ${d.id}, Name: ${d.name}`);
    });
}

check().catch(console.error);
