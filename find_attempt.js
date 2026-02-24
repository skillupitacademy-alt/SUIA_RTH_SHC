const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require&channel_binding=require"
});

async function findAttempt() {
    try {
        const res = await pool.query("SELECT id FROM exams WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 5");
        console.log("Recent Completed Attempt IDs:");
        res.rows.forEach(row => console.log(row.id));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findAttempt();
