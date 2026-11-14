import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitest/config';
const root = path.resolve(import.meta.dirname, '../..');
export default defineConfig({
    root,
    test: { environment: 'node', include: [process.env.R6_ROLLBACK_ONLY === '1' ? '.evidence/r6-neon-qualification/neon.rollback.test.ts' : process.env.R6_CROSSDB_ONLY === '1' ? '.evidence/r6-neon-qualification/neon.crossdb.test.ts' : '.evidence/r6-neon-qualification/neon.integration.test.ts'], testTimeout: 120000, hookTimeout: 120000, fileParallelism: false },
    resolve: { alias: [
            { find: '@quiz/db-people', replacement: path.join(root, 'packages/db-people/src') },
            { find: '@quiz/auth', replacement: path.join(root, 'packages/auth/src') },
            { find: '@quiz/types', replacement: path.join(root, 'packages/types/src') },
            { find: '@', replacement: path.join(root, 'services/skillhubcore-service/src') },
        ] },
});
