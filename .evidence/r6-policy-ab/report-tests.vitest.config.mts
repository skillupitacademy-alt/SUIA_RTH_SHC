import path from 'node:path';
import { defineConfig } from 'vitest/config';
const root=path.resolve(import.meta.dirname,'../../apps/skillup-admin');
export default defineConfig({root,test:{environment:'node',include:['src/lib/__tests__/student-report-identity.test.ts']},resolve:{tsconfigPaths:true,alias:[{find:'@',replacement:path.join(root,'src')},{find:'@quiz/db-people',replacement:path.resolve(root,'../../packages/db-people/src')},{find:'@quiz/types',replacement:path.resolve(root,'../../packages/types/src')}]}});
