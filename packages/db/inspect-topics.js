const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable
            FROM 
                information_schema.columns 
            WHERE 
                table_name = 'topics'
            ORDER BY 
                ordinal_position;
        `);

        console.log("COLUMNS_START");
        res.rows.forEach(row => {
            console.log(`${row.column_name} | ${row.data_type} | ${row.is_nullable}`);
        });
        console.log("COLUMNS_END");

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
main();
