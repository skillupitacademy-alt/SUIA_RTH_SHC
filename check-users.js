const { neon } = require('@neondatabase/serverless');

async function checkUsers() {
    const url = 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require';
    const sql = neon(url);

    try {
        console.log('--- USERS ---');
        const users = await sql`SELECT id, email FROM users`;
        console.log(JSON.stringify(users, null, 2));

        console.log('--- ROLES ---');
        const roles = await sql`SELECT id, name FROM roles`;
        console.log(JSON.stringify(roles, null, 2));

        console.log('--- USER ROLES ---');
        const userRoles = await sql`
            SELECT ur.user_id, u.email, r.name as role_name 
            FROM user_roles ur
            JOIN users u ON ur.user_id = u.id
            JOIN roles r ON ur.role_id = r.id
        `;
        console.log(JSON.stringify(userRoles, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkUsers();
