#!/usr/bin/env tsx
/**
 * Fix RTH Admin Shadow User
 * Updates the external_id for RTH admin shadow user in People DB
 */

import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixRTHAdminShadowUser() {
  console.log('\n🔧 Fixing RTH Admin Shadow User\n');
  console.log('='.repeat(70));

  const peopleDbUrl = process.env.DATABASE_URL_PEOPLE!;
  const rthDbUrl = process.env.DATABASE_URL_RTH!;

  try {
    // Step 1: Get RTH admin user ID from rth_prod
    console.log('Step 1: Get RTH admin user ID from rth_prod');
    const rthSql = neon(rthDbUrl);
    const rthAdmin = await rthSql`
      SELECT id, email, shadow_user_id
      FROM users
      WHERE email = 'admin@realtutorialhub.com'
    `;

    if (rthAdmin.length === 0) {
      console.log('   ❌ RTH admin not found in rth_prod');
      return;
    }

    const rthAdminId = rthAdmin[0].id;
    const rthAdminEmail = rthAdmin[0].email;
    const currentShadowId = rthAdmin[0].shadow_user_id;

    console.log(`   ✅ RTH admin found`);
    console.log(`      ID: ${rthAdminId}`);
    console.log(`      Email: ${rthAdminEmail}`);
    console.log(`      Current shadow_user_id: ${currentShadowId || 'null'}`);

    // Step 2: Find shadow user in People DB
    console.log('\nStep 2: Find shadow user in People DB');
    const peopleSql = neon(peopleDbUrl);
    const shadowUser = await peopleSql`
      SELECT id, external_id, email, platform
      FROM users
      WHERE email = ${rthAdminEmail}
      AND platform = 'realtutorialhub'
      AND deleted_at IS NULL
    `;

    if (shadowUser.length === 0) {
      console.log('   ❌ Shadow user not found in People DB');
      return;
    }

    const shadowUserId = shadowUser[0].id;
    const currentExternalId = shadowUser[0].external_id;

    console.log(`   ✅ Shadow user found`);
    console.log(`      Shadow ID: ${shadowUserId}`);
    console.log(`      Current external_id: ${currentExternalId || 'null'}`);

    // Step 3: Update external_id in People DB
    if (currentExternalId === null || currentExternalId !== rthAdminId) {
      console.log('\nStep 3: Update external_id in People DB');
      await peopleSql`
        UPDATE users
        SET external_id = ${rthAdminId},
            updated_at = NOW()
        WHERE id = ${shadowUserId}
      `;
      console.log(`   ✅ Updated external_id to: ${rthAdminId}`);
    } else {
      console.log('\nStep 3: external_id already correct');
    }

    // Step 4: Update shadow_user_id in rth_prod
    if (currentShadowId === null || currentShadowId !== shadowUserId) {
      console.log('\nStep 4: Update shadow_user_id in rth_prod');
      await rthSql`
        UPDATE users
        SET shadow_user_id = ${shadowUserId},
            updated_at = NOW()
        WHERE id = ${rthAdminId}
      `;
      console.log(`   ✅ Updated shadow_user_id to: ${shadowUserId}`);
    } else {
      console.log('\nStep 4: shadow_user_id already correct');
    }

    // Step 5: Verify the fix
    console.log('\nStep 5: Verify the fix');
    const verifyPeople = await peopleSql`
      SELECT id, external_id, email, platform
      FROM users
      WHERE id = ${shadowUserId}
    `;

    const verifyRth = await rthSql`
      SELECT id, email, shadow_user_id
      FROM users
      WHERE id = ${rthAdminId}
    `;

    console.log('   People DB:');
    console.log(`      Shadow ID: ${verifyPeople[0].id}`);
    console.log(`      External ID: ${verifyPeople[0].external_id}`);
    console.log(`      Email: ${verifyPeople[0].email}`);

    console.log('   RTH DB:');
    console.log(`      User ID: ${verifyRth[0].id}`);
    console.log(`      Shadow User ID: ${verifyRth[0].shadow_user_id}`);
    console.log(`      Email: ${verifyRth[0].email}`);

    const isLinked = verifyPeople[0].external_id === verifyRth[0].id &&
                     verifyRth[0].shadow_user_id === verifyPeople[0].id;

    if (isLinked) {
      console.log('\n   ✅ Shadow user properly linked!');
      console.log('\n🎉 RTH admin login should work now!');
    } else {
      console.log('\n   ❌ Shadow user NOT properly linked');
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Fix complete\n');
}

fixRTHAdminShadowUser();
