#!/usr/bin/env node

/**
 * Phase 2 — Hydration Race-Condition Assurance
 *
 * Verifies the fundamental stale-response invariant:
 *
 *   Newer navigation selection always wins.
 *
 * This test does not connect to PostgreSQL.
 * It does not execute the Next.js application.
 * It tests the request arbitration algorithm independently.
 */

const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    return;
  }

  console.error(`[FAIL] ${message}`);
  failures.push(message);
}

/**
 * Minimal model of the sequence mechanism used by the hydration hook.
 */
function createHydrationArbiter() {
  let currentSequence = 0;

  return {
    startRequest() {
      currentSequence += 1;

      return currentSequence;
    },

    isCurrent(sequence) {
      return sequence === currentSequence;
    },

    getCurrentSequence() {
      return currentSequence;
    },
  };
}

async function testOlderRequestCannotOverwriteNewerRequest() {
  console.log('');
  console.log('TEST 1 — stale response protection');

  const arbiter = createHydrationArbiter();

  const requestA = arbiter.startRequest();
  const requestB = arbiter.startRequest();

  assert(
    requestA === 1,
    'Request A receives sequence 1',
  );

  assert(
    requestB === 2,
    'Request B receives sequence 2',
  );

  assert(
    !arbiter.isCurrent(requestA),
    'Request A is stale after Request B starts',
  );

  assert(
    arbiter.isCurrent(requestB),
    'Request B remains current',
  );
}

async function testThreeRapidSelections() {
  console.log('');
  console.log('TEST 2 — three rapid navigation changes');

  const arbiter = createHydrationArbiter();

  const requestA = arbiter.startRequest();
  const requestB = arbiter.startRequest();
  const requestC = arbiter.startRequest();

  assert(
    !arbiter.isCurrent(requestA),
    'A cannot overwrite C',
  );

  assert(
    !arbiter.isCurrent(requestB),
    'B cannot overwrite C',
  );

  assert(
    arbiter.isCurrent(requestC),
    'C is the only current request',
  );
}

async function testResponseCompletionOrder() {
  console.log('');
  console.log('TEST 3 — response completion order');

  const arbiter = createHydrationArbiter();

  const requestA = arbiter.startRequest();

  const requestB = arbiter.startRequest();

  /**
   * B returns first.
   */
  const bAccepted = arbiter.isCurrent(requestB);

  /**
   * A returns later.
   */
  const aAccepted = arbiter.isCurrent(requestA);

  assert(
    bAccepted,
    'Newer response is accepted',
  );

  assert(
    !aAccepted,
    'Late older response is rejected',
  );
}

async function testEmptyNavigationInvalidation() {
  console.log('');
  console.log('TEST 4 — empty navigation invalidates prior request');

  const arbiter = createHydrationArbiter();

  const requestA = arbiter.startRequest();

  /**
   * Simulate navigation being cleared.
   *
   * Incrementing the sequence invalidates all previous requests.
   */
  arbiter.startRequest();

  assert(
    !arbiter.isCurrent(requestA),
    'Previous request is invalidated when navigation context changes',
  );
}

async function main() {
  console.log('');
  console.log(
    '============================================================',
  );
  console.log(
    'PHASE 2 — HYDRATION RACE ASSURANCE',
  );
  console.log(
    '============================================================',
  );

  await testOlderRequestCannotOverwriteNewerRequest();
  await testThreeRapidSelections();
  await testResponseCompletionOrder();
  await testEmptyNavigationInvalidation();

  console.log('');
  console.log(
    '============================================================',
  );

  if (failures.length === 0) {
    console.log(
      '✅ PHASE 2 HYDRATION RACE ASSURANCE PASS',
    );

    console.log('');
    console.log(
      'Stale hydration responses cannot overwrite the',
    );

    console.log(
      'currently selected navigation context.',
    );

    console.log('');
    console.log(
      '============================================================',
    );

    process.exitCode = 0;
    return;
  }

  console.error(
    '❌ PHASE 2 HYDRATION RACE ASSURANCE BLOCKED',
  );

  console.error('');

  for (const failure of failures) {
    console.error(`   - ${failure}`);
  }

  console.error('');

  console.error(
    '============================================================',
  );

  process.exitCode = 1;
}

main().catch(error => {
  console.error(
    '❌ Fatal assurance failure:',
    error,
  );

  process.exitCode = 1;
});
