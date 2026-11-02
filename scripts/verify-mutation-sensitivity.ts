/**
 * Standalone Mutation Sensitivity Verification Runner (W1.2-SESS-01)
 *
 * Demonstrates mutation sensitivity by:
 * 1. Reading the actual production repository source (token.repository.ts)
 * 2. Creating a disposable mutant with ONLY the owner predicate removed from the WHERE clause
 * 3. Executing both mutant and protected implementations against identical fixture state
 * 4. Proving that the pre-fix/mutant version revokes the victim session (cross-user breach)
 * 5. Proving that the post-fix production version leaves the victim session active (protected)
 */

import * as fs from 'fs';
import * as path from 'path';

interface SessionRow {
  id: string;
  userId: string;
  revoked: boolean;
}

class FixtureStore {
  sessions: SessionRow[] = [];

  reset() {
    this.sessions = [];
  }

  insert(row: SessionRow) {
    this.sessions.push({ ...row });
  }

  findById(id: string) {
    return this.sessions.find(s => s.id === id);
  }

  applyPredicate(predicate: any, updates: Partial<SessionRow>): number {
    const conditions = predicate.op === 'and' ? predicate.conditions : [predicate];
    let affected = 0;
    for (const s of this.sessions) {
      let matches = true;
      for (const c of conditions) {
        if (c.op === 'eq') {
          const field = c.field.split('.').pop();
          if (s[field as keyof SessionRow] !== c.value) {
            matches = false;
            break;
          }
        }
      }
      if (matches) {
        Object.assign(s, updates);
        affected++;
      }
    }
    return affected;
  }
}

async function run() {
  console.log('🔍 [W1.2-SESS-01] Running Mutation Sensitivity Verification...');

  const prodFile = path.resolve(__dirname, '../apps/api-server/src/modules/auth/repositories/token.repository.ts');
  const prodSource = fs.readFileSync(prodFile, 'utf8');

  // Verify production contains owner predicate
  if (!prodSource.includes('eq(this.refreshTokensTable.userId, userId)')) {
    throw new Error('Production source missing required owner predicate!');
  }
  console.log('✅ 1. Production source verified: contains dual-predicate WHERE clause.');

  // Extract revokeById
  const match = prodSource.match(/async revokeById\([^)]*\)\s*\{([\s\S]*?)\n  \}/);
  if (!match) {
    throw new Error('Could not extract revokeById method from production source');
  }

  // Mutate by removing owner predicate only
  const mutantBody = match[1].replace(/,\s*eq\(this\.refreshTokensTable\.userId,\s*userId\)/, '');
  if (mutantBody.includes('eq(this.refreshTokensTable.userId, userId)')) {
    throw new Error('Failed to remove owner predicate from mutant');
  }
  console.log('✅ 2. Disposable mutant generated: owner predicate removed, actor validation intact.');

  const store = new FixtureStore();

  // Helper to create mocked DB context
  function createMockRepo(body: string) {
    let capturedPredicate: any = null;
    const dbInstance = {
      update: () => ({
        set: (updates: any) => ({
          where: async (pred: any) => {
            capturedPredicate = pred;
            return store.applyPredicate(pred, updates);
          }
        })
      })
    };
    const refreshTokensTable = {
      id: 'refreshTokens.id',
      userId: 'refreshTokens.userId'
    };

    const and = (...conditions: any[]) => ({ op: 'and', conditions });
    const eq = (field: any, value: any) => ({ op: 'eq', field: String(field), value });

    return {
      revokeById: async function(id: string, userId: string) {
        const self = { dbInstance, refreshTokensTable };
        // Execute extracted production method body with mock context
        await eval('(async function(and, eq) {' + body + '}).call(self, and, eq)');
      },
      getPredicate: () => capturedPredicate
    };
  }

  // --- EXPERIMENT 1: MUTANT (PRE-FIX) ---
  store.reset();
  store.insert({ id: 'session-victim', userId: 'user-B', revoked: false });
  const mutantRepo = createMockRepo(mutantBody);

  console.log('\n🧪 Experiment 1: Running cross-user revocation against MUTANT (pre-fix)...');
  await mutantRepo.revokeById('session-victim', 'user-A');
  const mutantVictim = store.findById('session-victim');
  console.log(`   Victim session status: revoked = ${mutantVictim?.revoked}`);

  if (mutantVictim?.revoked !== true) {
    throw new Error('Mutant failed to demonstrate vulnerability!');
  }
  console.log('🚨 VULNERABILITY CONFIRMED: Without owner predicate, User A revoked User B\'s session.');

  // --- EXPERIMENT 2: PROTECTED (POST-FIX) ---
  store.reset();
  store.insert({ id: 'session-victim', userId: 'user-B', revoked: false });
  const protectedRepo = createMockRepo(match[1]);

  console.log('\n🛡️ Experiment 2: Running cross-user revocation against PROTECTED (post-fix)...');
  await protectedRepo.revokeById('session-victim', 'user-A');
  const protectedVictim = store.findById('session-victim');
  console.log(`   Victim session status: revoked = ${protectedVictim?.revoked}`);

  if (protectedVictim?.revoked !== false) {
    throw new Error('Protected implementation failed to protect victim session!');
  }
  console.log('✅ PROTECTION CONFIRMED: With owner predicate, User B\'s session remained active (0 rows updated).');

  console.log('\n🎉 [W1.2-SESS-01] Mutation Sensitivity Verification PASSED completely.');
}

run().catch(err => {
  console.error('❌ Mutation verification failed:', err);
  process.exit(1);
});
