const { neon } = require('@neondatabase/serverless');

async function listTables() {
    const url = 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require';
    const sql = neon(url);

    try {
        const res = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;

        console.log('--- TABLE LIST START ---');
        res.forEach(row => {
            console.log(row.table_name);
        });
        console.log('--- TABLE LIST END ---');
    } catch (err) {
        console.error('Error connecting to DB:', err.message);
    }
}

listTables();
