import fs from 'fs';
import path from 'path';

const baseDir = path.resolve(__dirname, '../../../apps/realtutorialhub-web/src/components/content/modular');

function walk(dir: string, callback: (filePath: string) => void) {
    const files = fs.read
<truncated 2694 bytes>