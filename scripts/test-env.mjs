import 'dotenv/config';
import { join } from 'path';
import { config } from 'dotenv';

const workspaceRoot = join(import.meta.dirname, '../../..');
config({ path: join(workspaceRoot, '.env.local'), override: true });

const val = process.env.DATABASE_URL_TUTORIAL;
console.log('Value present:', !!val);
console.log('Starts with quote:', val?.startsWith('"'));
console.log('Ends with quote:', val?.endsWith('"'));
console.log('Length:', val?.length);
console.log('First 60 chars:', val?.substring(0, 60));
