#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../packages/db-rth/src/schema/users';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// RTH Database connection
const connectionString = process.env.DATABASE_URL_RTH || process.env.DATABASE_DIRECT_URL_RTH;
if (!connectionString) {
  console.error('❌ RTH database connection string not found');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkAndFixUser() {
  try {
    console.log('🔍 Checking RTH database for user: ajayshah@gmail.com');
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'ajayshah@gmail.com'))
      .limit(1);

    if (existingUser.length === 0) {
      console.log('❌ User ajayshah@gmail.com not found in RTH database');
      console.log('🔧 Creating user with password "testing"...');
      
      // Hash the password
      const passwordHash = await bcrypt.hash('testing', 12);
      
      // Create user
      const newUser = await db
        .insert(users)
        .values({
          email: 'ajayshah@gmail.com',
          passwordHash,
          emailVerified: true,
          isBlocked: false,
          isOnboarded: false,
        })
        .returning();
      
      console.log('✅ User created successfully:', newUser[0].id);
      return;
    }

    const user = existingUser[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      isBlocked: user.isBlocked,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt,
    });

    // Test password
    const isValidPassword = await bcrypt.compare('testing', user.passwordHash);
    console.log('🔐 Password "testing" valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('🔧 Updating password to "testing"...');
      const newPasswordHash = await bcrypt.hash('testing', 12);
      
      await db
        .update(users)
        .set({ 
          passwordHash: newPasswordHash,
          emailVerified: true,
          isBlocked: false,
        })
        .where(eq(users.id, user.id));
      
      console.log('✅ Password updated successfully');
    }

    if (user.isBlocked) {
      console.log('🔧 Unblocking user...');
      await db
        .update(users)
        .set({ isBlocked: false })
        .where(eq(users.id, user.id));
      console.log('✅ User unblocked');
    }

    if (!user.emailVerified) {
      console.log('🔧 Verifying email...');
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));
      console.log('✅ Email verified');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkAndFixUser();