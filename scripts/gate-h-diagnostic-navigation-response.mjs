/**
 * Gate H Diagnostic: Capture Navigation API Response Structure
 * 
 * PURPOSE:
 * Capture the actual navigation API response after D1 completion
 * to verify if completedAt is present in blocks array.
 * 
 * AUDIT QUESTION:
 * After completion POST succeeds, does GET /api/tutorial/ils/navigation/:nodeId
 * return D1 in the blocks array with completedAt populated?
 */

import 'dotenv/config';

const BASE_URL = 'http://skillup.localhost:3009';
const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

const STUDENT_EMAIL = 'student@skillupitacademy.com';
const STUDENT_PASSWORD = 'testing';

async function main() {
  console.log('=== Gate H Diagnostic: Navigation API Response ===\n');
  
  // STEP 1: Login to get access token
  console.log('STEP 1: Authenticate...\n');
  
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
    }),
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Login failed:', loginResponse.status);
    process.exit(1);
  }
  
  // Extract access token from Set-Cookie header
  const setCookieHeader = loginResponse.headers.get('set-cookie');
  let accessToken = null;
  
  if (setCookieHeader) {
    const tokenMatch = setCookieHeader.match(/accessToken=([^;]+)/);
    if (tokenMatch) {
      accessToken = tokenMatch[1];
    }
  }
  
  if (!accessToken) {
    console.error('❌ No access token in response');
    process.exit(1);
  }
  
  console.log('✅ Authenticated\n');
  
  // STEP 2: Call navigation API
  console.log('STEP 2: Fetch navigation progress...\n');
  
  const url = `${BASE_URL}/api/tutorial/ils/navigation/${NAVIGATION_NODE_ID}?subtopicId=${encodeURIComponent(SUBTOPIC_ID)}`;
  
  console.log('Target:', url);
  console.log('Looking for D1 block:', D1_BLOCK_ID);
  console.log();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': `accessToken=${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      process.exit(1);
    }
    
    const body = await response.json();
    const data = body.data;
    
    console.log('\n=== Navigation Progress Overview ===');
    console.log('Navigation node:', data.navigationNodeId);
    console.log('Status:', data.status);
    console.log('Progress:', `${data.progressPercentage}%`);
    console.log('Completed blocks (canonical):', data.completedBlockCount, '/', data.totalBlockCount);
    
    console.log('\n=== Canonical completedBlocks Array ===');
    console.log('Length:', data.completedBlocks.length);
    data.completedBlocks.forEach((cb, idx) => {
      console.log(`[${idx}]`, {
        blockId: cb.blockId,
        blockVersion: cb.blockVersion,
        completedAt: cb.completedAt,
      });
    });
    
    console.log('\n=== blocks Array (BlockLearningStateDTO[]) ===');
    console.log('Length:', data.blocks.length);
    data.blocks.forEach((block, idx) => {
      console.log(`[${idx}]`, {
        blockId: block.blockId,
        blockVersion: block.blockVersion,
        activeTimeSec: block.activeTimeSec,
        completedAt: block.completedAt,
        visitCount: block.visitCount,
      });
    });
    
    console.log('\n=== D1 Block Analysis ===');
    const d1InCanonical = data.completedBlocks.find(
      cb => cb.blockId === D1_BLOCK_ID && cb.blockVersion === 'D1'
    );
    
    const d1InBlocks = data.blocks.find(
      b => b.blockId === D1_BLOCK_ID && b.blockVersion === 'D1'
    );
    
    console.log('D1 in completedBlocks (canonical)?', d1InCanonical ? '✅ YES' : '❌ NO');
    if (d1InCanonical) {
      console.log('  - completedAt:', d1InCanonical.completedAt);
    }
    
    console.log('D1 in blocks array?', d1InBlocks ? '✅ YES' : '❌ NO');
    if (d1InBlocks) {
      console.log('  - activeTimeSec:', d1InBlocks.activeTimeSec);
      console.log('  - completedAt:', d1InBlocks.completedAt);
      console.log('  - visitCount:', d1InBlocks.visitCount);
    }
    
    console.log('\n=== DIAGNOSTIC RESULT ===');
    if (d1InCanonical && d1InBlocks && d1InBlocks.completedAt) {
      console.log('✅ EXPECTED: D1 has canonical completion AND is in blocks array with completedAt');
      console.log('   Frontend SHOULD map this to isCompleted=true');
    } else if (d1InCanonical && d1InBlocks && !d1InBlocks.completedAt) {
      console.log('🔴 BACKEND BUG: D1 is in both arrays but blocks[].completedAt is NULL');
      console.log('   resolveBlockCompletedAt() may not be working');
    } else if (d1InCanonical && !d1InBlocks) {
      console.log('🔴 BACKEND BUG: D1 is in completedBlocks but NOT in blocks array');
      console.log('   toDTO() should include ALL blocks that have telemetry state');
    } else {
      console.log('🔴 DATA ERROR: D1 not in completedBlocks - completion never persisted');
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
    process.exit(1);
  }
}

main();
