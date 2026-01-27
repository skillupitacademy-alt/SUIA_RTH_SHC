import { db, users, roles, userRoles } from './packages/db/src/index';
import { eq } from 'drizzle-orm';

async function check() {
    console.log("Checking User Roles...");
    const allRoles = await db.select().from(roles);
    console.log("Available Roles:", allRoles);

    const allUserRoles = await db.select().from(userRoles);
    console.log("Assigned User Roles:", allUserRoles);

    const admins = await db.select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(roles.name, 'SUPER_ADMIN'));
    
    console.log("Super Admins found:", admins.length);
    admins.forEach(a => {
        console.log(`- UserID: ${a.user_roles.userId}, Role: ${a.roles.name}`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
