
import { NextResponse } from 'next/server';
import { db, users, userRoles, roles } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { PasswordService } from '@/modules/auth/password.service';

export async function GET() {
  try {
      const email = 'admin@quizplatform.com';
      const newPassword = 'Admin123!';
      
      console.log(`[RESET] Resetting Admin: ${email}`);

      // 1. Find User
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
        with: {
            userRoles: {
                with: { role: true }
            }
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 2. Hash New Password using SERVICE
      const passwordHash = await PasswordService.hash(newPassword);

      // 3. Update User
      await db.update(users)
        .set({ passwordHash })
        .where(eq(users.id, user.id));

      // 4. Verify Role
      const hasAdminRole = user.userRoles.some(ur => ur.role.name === 'ADMIN');
      let roleStatus = 'Existing ADMIN role confirmed';

      if (!hasAdminRole) {
          const adminRole = await db.query.roles.findFirst({ where: eq(roles.name, 'ADMIN') });
          if (adminRole) {
              await db.insert(userRoles).values({
                  userId: user.id,
                  roleId: adminRole.id
              });
              roleStatus = 'Added missing ADMIN role';
          } else {
              roleStatus = 'ERROR: ADMIN role missing in DB';
          }
      }

      // 5. Verify Hash (Self-Check)
      const isMatch = await PasswordService.compare(newPassword, passwordHash);

      return NextResponse.json({ 
          message: 'Admin Password Reset Successfully',
          debug: {
              email,
              roleStatus,
              hashVerify: isMatch // Should be true
          }
      });
  } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
