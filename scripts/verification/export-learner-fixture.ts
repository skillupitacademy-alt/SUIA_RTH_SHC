import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { GENERATED_BLOCK_REGISTRIES } from '../../apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries';
import { TutorialBlockSchema } from '@quiz/types';

const [family, version, output] = process.argv.slice(2);
if (!family || !version || !output) throw new Error('Usage: export-learner-fixture.ts FAMILY VERSION OUTPUT_JSON');
const definition = GENERATED_BLOCK_REGISTRIES.find((item) => item.id === family.toLowerCase())
  ?.versions.find((item) => item.code === version.toUpperCase());
if (!definition) throw new Error('Requested generated block version is not registered');
const block = TutorialBlockSchema.parse({
  id: randomUUID(), type: family.toLowerCase(), version: version.toUpperCase(),
  content: definition.getDefaultPayload(), expectedTimeSec: 60, progressRole: 'instructional',
});
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(block, null, 2));
console.log('Validated registry-default block exported for diagnostic verification.');
