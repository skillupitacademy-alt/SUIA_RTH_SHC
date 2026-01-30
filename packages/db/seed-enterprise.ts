
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL not found");

    const sql = neon(dbUrl);
    
    const files = [
        'sample-data.sql',
        'populate-blueprints.sql'
    ];

    for (const file of files) {
        console.log(`Executing ${file}...`);
        const filePath = path.join(__dirname, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Remove comments and split by semicolon
        const statements = content
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await sql(statement);
            } catch (err: any) {
                if (!err.message.includes('already exists')) {
                    console.error(`Error in statement: ${statement.substring(0, 50)}...`);
                    console.error(err.message);
                }
            }
        }
    }
    console.log("Seeding complete!");
}

seed().catch(console.error);
