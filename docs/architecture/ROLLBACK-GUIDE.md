# Rollback Guide: Admin Routes Removal

## Quick Rollback Commands

### Option 1: Revert the Merge (Recommended)

This keeps the history clean and is the safest option:

```bash
# Find the merge commit hash
git log --oneline --merges -1

# Revert the merge (use -m 1 to specify the mainline parent)
git revert -m 1 <merge-commit-hash>

# Push the revert
git push origin main
```

**Example:**
```bash
git log --oneline --merges -1
# Output: abc1234 Merge: Remove admin routes and layman table

git revert -m 1 abc1234
git push origin main
```

### Option 2: Hard Reset (Use with Caution!)

Only use if you haven't pushed to remote yet:

```bash
# Find the commit before the merge
git log --oneline -5

# Reset to the commit before merge
git reset --hard <commit-before-merge>

# Force push (DANGEROUS if others are using the branch)
git push -f origin main
```

---

## Database Restoration

After reverting the code, restore the database:

### Step 1: Check if Backup Tables Exist

```bash
npx tsx scripts/verify-layman-removal.ts
```

Or manually:
```sql
SELECT COUNT(*) FROM tutorial_section_layman_backup_20260815;
SELECT COUNT(*) FROM tutorial_sections_layman_backup_20260815;
```

### Step 2: Restore the Table

```sql
-- Recreate the table structure
CREATE TABLE tutorial_section_layman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES tutorial_sections(id) ON DELETE CASCADE,
  simple_overview JSONB NOT NULL,
  everyday_analogy JSONB NOT NULL,
  why_it_exists JSONB NOT NULL,
  simple_use_cases JSONB NOT NULL,
  beginner_breakdown JSONB NOT NULL,
  mental_model JSONB NOT NULL,
  common_confusions JSONB NOT NULL,
  simple_recap JSONB NOT NULL,
  hero_visual_svg JSONB,
  analogy_svg JSONB,
  mental_model_svg JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Restore the data
INSERT INTO tutorial_section_layman 
SELECT * FROM tutorial_section_layman_backup_20260815;

-- Restore related tutorial_sections records
INSERT INTO tutorial_sections 
SELECT * FROM tutorial_sections_layman_backup_20260815
ON CONFLICT (id) DO NOTHING;

-- Verify restoration
SELECT COUNT(*) FROM tutorial_section_layman;
```

### Step 3: Verify Application

```bash
# Test the application
npm run dev --workspace=@quiz/skillhubcore-admin

# Check routes are accessible:
# - https://admin.skillhubcore.in/content-generation/global-architecture
# - https://admin.skillhubcore.in/content-generation/layman
# - https://admin.skillhubcore.in/tools/visual-guide
# - https://admin.skillhubcore.in/tools/prompt-generator
```

---

## Automated Rollback Script

Create and run this script:

```typescript
// scripts/rollback-layman-removal.ts
import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';

async function rollback() {
  console.log('🔄 Starting rollback...\n');
  
  // Create table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tutorial_section_layman (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID NOT NULL REFERENCES tutorial_sections(id) ON DELETE CASCADE,
      simple_overview JSONB NOT NULL,
      everyday_analogy JSONB NOT NULL,
      why_it_exists JSONB NOT NULL,
      simple_use_cases JSONB NOT NULL,
      beginner_breakdown JSONB NOT NULL,
      mental_model JSONB NOT NULL,
      common_confusions JSONB NOT NULL,
      simple_recap JSONB NOT NULL,
      hero_visual_svg JSONB,
      analogy_svg JSONB,
      mental_model_svg JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  
  // Restore data
  await db.execute(sql`
    INSERT INTO tutorial_section_layman 
    SELECT * FROM tutorial_section_layman_backup_20260815
    ON CONFLICT (id) DO NOTHING;
  `);
  
  console.log('✅ Rollback complete!');
}

main();
```

Run it:
```bash
npx tsx scripts/rollback-layman-removal.ts
```

---

## Why Use `git revert -m 1`?

The `-m 1` flag tells Git:
- We're reverting a **merge commit**
- Use the **first parent** (mainline branch) as the base
- This keeps the branch history intact
- Allows you to merge again later if needed

**Visual:**
```
Before:
  main: A -- B -- M (merge)
                 / 
  feature:  C -- D

After revert:
  main: A -- B -- M -- R (revert of M)
                 /       
  feature:  C -- D
```

The revert commit `R` undoes all changes from the merge `M`, effectively bringing you back to state `B`.

---

## Prevention: Testing Before Merge

Always test in a staging environment:

```bash
# Create a test branch
git checkout -b test-merge
git merge remove-admin-tools-routes

# Test thoroughly
npm run build
npm run test
# Manual testing...

# If good, merge to main
git checkout main
git merge --no-ff remove-admin-tools-routes
```

---

## Emergency Contacts

If rollback fails:
1. Check backup tables exist: `SELECT * FROM tutorial_section_layman_backup_20260815 LIMIT 1;`
2. Review BACKUP-README.md for detailed restoration steps
3. Contact database admin if structure is corrupted
4. Use database point-in-time recovery if available

---

## Verification After Rollback

✅ **Code Checklist:**
- [ ] Routes accessible: `/content-generation/global-architecture`
- [ ] Routes accessible: `/content-generation/layman`
- [ ] Routes accessible: `/tools/visual-guide`
- [ ] Routes accessible: `/tools/prompt-generator`
- [ ] Navigation shows all menu items
- [ ] No 404 errors on route navigation

✅ **Database Checklist:**
- [ ] Table exists: `SELECT * FROM tutorial_section_layman LIMIT 1;`
- [ ] Data restored: `SELECT COUNT(*) FROM tutorial_section_layman;`
- [ ] Foreign keys intact: `SELECT * FROM tutorial_sections WHERE section_type = 'layman' LIMIT 1;`

✅ **Build Checklist:**
- [ ] TypeScript compiles: `npm run type-check`
- [ ] No import errors
- [ ] Application starts without errors
