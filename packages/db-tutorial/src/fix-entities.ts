import fs from 'fs';
import path from 'path';

const baseDir = path.resolve(__dirname, '../../../apps/realtutorialhub-web/src/components/content/modular');

function walk(dir: string) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (f.endsWith('.tsx')) {
            let content = fs.readFileSync(p, 'utf8');
            // Escape unescaped apostrophes in JSX text
            const newContent = content.replace(/'(?![^<]*>)/g, '&apos;');
            if (content !== newContent) {
                fs.writeFileSync(p, newContent);
                console.log(`Fixed entities in: ${p}`);
            }
        }
    });
}

console.log('Scanning for unescaped entities...');
walk(baseDir);
console.log('Entity fix complete.');