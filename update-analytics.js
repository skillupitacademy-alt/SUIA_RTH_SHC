const fs = require('fs');
let code = fs.readFileSync('packages/api-client/src/modules/analytics-client.ts', 'utf8');
code = code.replace(/import \{ FetchClient \} from '\.\.\/core\/fetch-client';/, "import { FetchClient, TIMEOUTS } from '../core/fetch-client';");
code = code.replace(/return this\.client\.get<([^>]+)>\(([^,)]+)\);/g, (match, p1, p2) => `return this.client.get<${p1}>(${p2}, { timeout: TIMEOUTS.LONG });`);
fs.writeFileSync('packages/api-client/src/modules/analytics-client.ts', code);
console.log('done');
