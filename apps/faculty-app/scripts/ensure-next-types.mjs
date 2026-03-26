import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(scriptDir, '..');
const typesDir = join(appRoot, '.next', 'types');
mkdirSync(typesDir, { recursive: true });
writeFileSync(join(typesDir, 'routes.js'), 'export {}\n');
