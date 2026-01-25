
import { NextResponse } from 'next/server';
import { db, users, userRoles, roles, userProfiles } from '@quiz/db';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

export async function GET() {
  try {
      // Use Env Vars or Generate Random Secure Default
      const email = process.env.ADMIN_EMAIL || 'admin@quizplatform.com'; // Fallback for dev convenience if allowed
      const defaultPassword = Math.random().toString(36).slice(-8) + "Aa1!"; // Random logic if not set
      const password = process.env.ADMIN_PASSWORD || defaultPassword;
      const name = process.env.ADMIN_NAME || 'Root Administrator';
      
      console.log(`[SETUP] Seeding Admin: ${email}`);

      // 1. Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (existingUser) {
        return NextResponse.json({ message: 'Admin user already exists' });
      }

      // 2. Hash Password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // 3. Create User
      const [user] = await db.insert(users).values({
        email,
        passwordHash,
        emailVerified: true
      }).returning();

      // 4. Create Profile
      await db.insert(userProfiles).values({
        userId: user.id,
        name
      });

      // 5. Ensure ADMIN role exists
      let adminRole = await db.query.roles.findFirst({
        where: eq(roles.name, 'ADMIN')
      });

      if (!adminRole) {
        console.log('Creating ADMIN role...');
        [adminRole] = await db.insert(roles).values({
          name: 'ADMIN'
        }).returning();
      }

      // 6. Assign Role
      await db.insert(userRoles).values({
        userId: user.id,
        roleId: adminRole.id
      });

      return NextResponse.json({ 
          message: 'Admin User Created Successfully',
          credentials: { email, password }
      });
  } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
