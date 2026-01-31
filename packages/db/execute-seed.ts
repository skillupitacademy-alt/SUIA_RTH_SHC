import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Load environment variables from specific paths
const envPaths = [
    path.resolve(__dirname, '../../apps/api-server/.env.local'),
    path.resolve(__dirname, '../../apps/api-server/.env'),
    path.resolve(__dirname, '../../../apps/web-app/.env.local'),
    path.resolve(__dirname, '../../../apps/web-app/.env'),
    path.resolve(__dirname, '../../apps/web-app/.env.local'),
    path.resolve(__dirname, '../../apps/web-app/.env'),
    path.resolve(__dirname, '../../.env.local'),
    path.resolve(__dirname, '../../.env')
];

let dbUrl: string | undefined;

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath });
        if (result.parsed) {
            if (result.parsed.DATABASE_URL_DEV) {
                dbUrl = result.parsed.DATABASE_URL_DEV;
                break;
            }
            if (result.parsed.DATABASE_URL) {
                dbUrl = result.parsed.DATABASE_URL;
                break; 
            }
            if (result.parsed.DATABASE_DIRECT_URL) {
                dbUrl = result.parsed.DATABASE_DIRECT_URL;
                break;
            }
             if (result.parsed.POSTGRES_URL) {
                dbUrl = result.parsed.POSTGRES_URL;
                break; 
            }
        }
    }
}

if (!dbUrl) {
    if (process.env.DATABASE_URL) {
         dbUrl = process.env.DATABASE_URL;
    } else {
        console.error("Error: DATABASE_URL not found in .env files or process environment.");
        process.exit(1);
    }
}

const pool = new Pool({ connectionString: dbUrl! });
const db = drizzle(pool, { schema: undefined }); // schema is not defined in the provided context, setting to undefined

async function runSeed() {
    try {
        const seedFilePath = path.join(__dirname, 'test-users.sql');
        
        if (!fs.existsSync(seedFilePath)) {
             console.error(`Error: Seed file not found at ${seedFilePath}`);
             process.exit(1);
        }

        const seedSql = fs.readFileSync(seedFilePath, 'utf-8');
        
        // Strip comments and split by semicolon correctly
        const cleanSql = seedSql
            .replace(/--.*$/gm, '') // Remove single line comments
            .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
            
        const statements = cleanSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);


        for (const statement of statements) {
            try {
                await sql(statement);
            } catch (stmtErr: any) {
                 // Ignore "already exists" errors during seed
                 if (stmtErr.message.includes('already exists')) {
                 } else {
                     console.error("Error executing statement:", statement.substring(0, 100) + "...");
                     console.error(stmtErr.message);
                     // continue regardless for seed
                 }
            }
        }

    } catch (error) {
        console.error("Error executing seed:", error);
        process.exit(1);
    }
}

runSeed();
