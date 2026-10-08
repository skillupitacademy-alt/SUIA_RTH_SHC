import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const typesDir = join(process.cwd(), '.next', 'types');

mkdirSync(typesDir, { recursive: true });

const routesPath = join(typesDir, 'routes.d.ts');
if (!existsSync(routesPath)) {
  writeFileSync(routesPath, 'export {}\n');
}

const validatorPath = join(typesDir, 'validator.ts');
if (!existsSync(validatorPath)) {
  writeFileSync(validatorPath, 'export {}\n');
}
