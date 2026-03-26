import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, '..');
const typesDir = join(projectRoot, '.next', 'types');
const shimPath = join(typesDir, 'routes.js.d.ts');
const shim = "export * from './routes';\n";

mkdirSync(typesDir, { recursive: true });
writeFileSync(shimPath, shim);
