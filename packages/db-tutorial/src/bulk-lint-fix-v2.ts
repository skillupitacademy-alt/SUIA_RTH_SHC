import fs from 'fs';
import path from 'path';

const baseDir = path.resolve(__dirname, '../../../apps/realtutorialhub-web/src/components/content/modular');

function walk(dir: string, callback: (filePath: string) => void) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, callback);
        } else {
            callback(filePath);
        }
    });
}

walk(baseDir, (filePath) => {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Remove unused imports (example: lucide-react icons)
        if (content.includes("import { LucideIcon } from 'lucide-react';") && !content.includes('LucideIcon')) {
            content = content.replace("import { LucideIcon } from 'lucide-react';", "");
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`Lint fix applied to: ${filePath}`);
        }
    }
});