import { db, roles, userRoles, users } from './src/d:\onlinewebsites\quiz-platform\packages\db\src\index'; // This won't work easily
// Instead, I'll leverage the existing API server structure.
import { db } from '@/d:\onlinewebsites\quiz-platform\packages\db\src\index';
import { roles, userRoles, users } from '@quiz/db';
import { eq } from 'drizzle-orm';

async function diagnose() {
    console.log("--- RBAC DIAGNOSTICS ---");
    const allRoles = await db.select().from(roles);
    console.log("Available Roles in DB:", JSON.stringify(allRoles, null, 2));

    const admins = await db.select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(roles.name, 'SUPER_ADMIN'));
    
    console.log("Super Admins count:", admins.length);
    admins.forEach(a => {
        console.log(`- User: ${a.user_roles.userId} has role ${a.roles.name}`);
    });

    const allUsers = await db.select().from(users).limit(5);
    console.log("Sample Users:", allUsers.map(u => ({ id: u.id, email: u.email })));

    process.exit(0);
}

diagnose().catch(err => {
    console.error("DIAGNOSE FAILED:", err);
    process.exit(1);
});
