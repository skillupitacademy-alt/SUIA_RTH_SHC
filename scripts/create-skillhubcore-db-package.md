# Create SkillHub Core Database Package

## Problem
SkillHub Core users are in people_db which has a different schema structure than brand-specific databases (RTH, SkillUp). The auth services expect:
- Separate `roles` and `userRoles` tables
- `userProfiles` table
- `verificationTokens`, `passwordResetTokens`, `loginAttempts` tables

People_db only has:
- `users` table with direct `role` column
- No separate roles/profiles tables

## Solution Options

### Option 1: Create db-skillhubcore package (RECOMMENDED)
Create a new database package following the same pattern as db-rth and db-skillup.

Steps:
1. Copy `packages/db-rth` to `packages/db-skillhubcore`
2. Update package.json name to `@quiz/db-skillhubcore`
3. Update DATABASE_URL to use skillhubcore database
4. Run migrations to create tables
5. Import in brand-db.ts
6. Migrate user from people_db to skillhubcore_db

### Option 2: Modify auth services to handle people_db schema
Update LoginService, AdminAuthService, etc. to detect people_db schema and handle it differently.

Pros: Uses existing people_db
Cons: Complex conditional logic, harder to maintain

### Option 3: Use quiz database (defaultDb) for skillhubcore
Create the user in the main quiz database instead of people_db.

Pros: Quick fix, works with existing code
Cons: Mixes quiz data with auth data, not clean separation

## Recommendation
Use Option 3 (quiz database) as immediate fix, then migrate to Option 1 (dedicated db-skillhubcore) later.

The user is already created in people_db, so we need to either:
- Create the same user in quiz database (defaultDb)
- OR update brand-db.ts to import people_db tables (but they don't match the expected structure)

For now, let's create the user in quiz database.
