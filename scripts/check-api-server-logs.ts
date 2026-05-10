import 'dotenv/config';
import { db, users } from '@quiz/db-people';
import { eq } from 'drizzle-orm';

async function checkUser() {
  console.log('🔍 Checking SkillHub Core user in people_db\n');

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@skillhubcore.in'))
      .limit(1);

    if (user.length === 0) {
      console.log('❌ User NOT found in people_db');
      console.log('   Email: admin@skillhubcore.in');
      return;
    }

    const u = user[0];
    console.log('✅ User found in people_db\n');
    console.log('User Details:');
    console.log('  ID:', u.id);
    console.log('  Email:', u.email);
    console.log('  Platform:', u.platform);
    console.log('  Role:', u.role);
    console.log('  External ID:', u.externalId);
    console.log('  External Brand:', u.externalBrand);
    console.log('  Password Hash Length:', u.passwordHash?.length || 0);
    console.log('  Created:', u.createdAt);
    console.log();

    // Test password
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare('testing', u.passwordHash);
    console.log('🔒 Password Test:');
    console.log('  Testing password: "testing"');
    console.log('  Result:', isValid ? '✅ VALID' : '❌ INVALID');
    console.log();

    if (!isValid) {
      console.log('⚠️  Password does not match!');
      console.log('   The user exists but the password is wrong.');
      console.log('   Expected: testing');
      console.log('   Hash in DB:', u.passwordHash?.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkUser();
