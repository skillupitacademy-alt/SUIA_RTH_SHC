import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const filePath = join(process.cwd(), '.next', 'types', 'routes.js');
mkdirSync(dirname(filePath), { recursive: true });
writeFileSync(filePath, 'export {};\\n');
