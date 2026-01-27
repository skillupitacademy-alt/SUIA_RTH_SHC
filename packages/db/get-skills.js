const { neon } = require('@neondatabase/serverless');

async function main() {
    const databaseUrl = "postgresql://postgres:postgres@localhost:5432/quiz_platform";
    const sql = neon(databaseUrl);
    try {
        const result = await sql`SELECT name FROM skills`;
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(err);
    }
}

main();
