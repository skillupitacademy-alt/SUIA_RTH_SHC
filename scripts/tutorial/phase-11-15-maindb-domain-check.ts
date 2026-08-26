#!/usr/bin/env tsx
/**
 * PHASE 11.15: Check MainDB domains table for Java's parent domain
 * Purpose: Verify domain.name and domain.slug to understand normalization
 */

import { getDb, domains } from '@quiz/db';
import { isNull } from 'drizzle-orm';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PHASE 11.15: MainDB Domain Investigation');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const db = getDb();

  console.log('Query: SELECT * FROM domains WHERE deleted_at IS NULL\n');

  const allDomains = await db
    .select()
    .from(domains)
    .where(isNull(domains.deletedAt));

  console.log(`Found ${allDomains.length} active domains\n`);

  allDomains.forEach((domain, idx) => {
    console.log(`[${idx + 1}] Domain:`);
    console.log(`    id:   ${domain.id}`);
    console.log(`    name: ${domain.name}`);
    console.log(`    slug: ${domain.slug || 'NULL'}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('KEY FINDING:');
  console.log('');
  console.log('tutorialSidebarDelivery.ts resolveHierarchy() uses:');
  console.log('  const domain = domainRows.find((row) => matchesSlug(row.name, params.domainSlug));');
  console.log('');
  console.log('It matches against domain.NAME, not domain.slug!');
  console.log('');
  console.log('Then it recalculates slug:');
  console.log('  slug: slugify(domain.name)');
  console.log('');
  console.log('So the database slug is IGNORED during sidebar delivery.');
  console.log('═══════════════════════════════════════════════════════════════');
}

main();
