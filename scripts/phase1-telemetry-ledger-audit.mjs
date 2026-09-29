#!/usr/bin/env node

/**
 * PHASE 1: Telemetry Ledger Audit
 * 
 * Query block_telemetry_events ledger to establish ground truth timeline.
 * This is immutable history — cannot be reset.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

const USER_ID = 'afc355ca-6bae-4165-89dd-198494a62f85';
const NAVIGATION_NODE_ID = 'whatisjava';

const BLOCKS = {
  I1: '7ffd2ee6-ec25-456d-9f0c-a85dc9e67b17',
  D1: '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749',
  C1: 'bb5dd80e-4b94-413f-8d46-b28d6e71f47f',
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n=== PHASE 1: Telemetry Ledger Audit ===\n');
    console.log('Target: whatisjava navigation for shadowUserId');
    console.log('Timeframe: All recorded history\n');

    for (const [name, blockId] of Object.entries(BLOCKS)) {
      console.log(`\n--- ${name} Block (${blockId.substring(0, 8)}...) ---`);

      const events = await pool.query(
        `SELECT 
           event_type,
           active_time_sec,
           active_time_delta_sec,
           created_at,
           metadata
         FROM block_telemetry_events
         WHERE user_id = $1
           AND navigation_node_id = $2
           AND block_id = $3
         ORDER BY created_at ASC`,
        [USER_ID, NAVIGATION_NODE_ID, blockId]
      );

      if (events.rows.length === 0) {
        console.log('  ❌ No telemetry events found');
      } else {
        console.log(`  Found ${events.rows.length} events:\n`);
        
        let cumulativeActive = 0;
        events.rows.forEach((event, idx) => {
          cumulativeActive = event.active_time_sec;
          const delta = event.active_time_delta_sec || 0;
          const timestamp = new Date(event.created_at).toISOString();
          
          console.log(`  [${idx}] ${event.event_type}`);
          console.log(`      activeTimeSec: ${event.active_time_sec}s (Δ${delta}s)`);
          console.log(`      timestamp: ${timestamp}`);
          
          if (event.metadata) {
            const meta = event.metadata;
            if (meta.expectedTimeSec) {
              console.log(`      expectedTimeSec: ${meta.expectedTimeSec}s`);
            }
            if (meta.visitCount) {
              console.log(`      visitCount: ${meta.visitCount}`);
            }
          }
          console.log('');
        });

        console.log(`  Cumulative activeTimeSec: ${cumulativeActive}s`);
        
        // Check last event timestamp
        const lastEvent = events.rows[events.rows.length - 1];
        const lastTimestamp = new Date(lastEvent.created_at);
        const now = new Date();
        const hoursSince = (now - lastTimestamp) / (1000 * 60 * 60);
        
        console.log(`  Last activity: ${hoursSince.toFixed(1)} hours ago`);
      }
    }

    console.log('\n=== Ledger Audit Complete ===\n');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
