import 'dotenv/config';
import { db, users, roles, userRoles } from '@quiz/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  console.log('🔧 Creating SkillHub Core Admin in Quiz DB\n');

  const email = 'admin@skillhubcore.in';
  const password = 'testing';

  try {
    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      console.log('⚠️  User already exists:', email);
      console.log('   ID:', existing[0].id);
      console.log('   Deleting and recreating...\n');
      
      // Delete existing user
      await db.delete(users).where(eq(users.id, existing[0].id));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        emailVerified: true,
      })
      .returning();

    console.log('✅ User created');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log();

    // Find or create super_admin role
    let role = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'super_admin'))
      .limit(1);

    if (role.length === 0) {
      console.log('📝 Creating super_admin role...');
      [role[0]] = await db
        .insert(roles)
        .values({
          name: 'super_admin',
          description: 'Super Administrator',
        })
        .returning();
      console.log('✅ Role created:', role[0].id);
    } else {
      console.log('✅ Found super_admin role:', role[0].id);
    }

    // Assign role
    await db.insert(userRoles).values({
      userId: user.id,
      roleId: role[0].id,
    });

    console.log('✅ Role assigned: super_admin');
    console.log();
    console.log('============================================================');
    console.log('📋 Summary');
    console.log('============================================================');
    console.log('✅ User created in Quiz DB (defaultDb)');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role: super_admin');
    console.log('   User ID:', user.id);
    console.log('============================================================');
    console.log();
    console.log('🎉 SkillHub Core admin is ready!');
    console.log('   Try logging in at: https://api.skillhubcore.in/api/auth/login');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

createAdmin();
