import fs from 'fs';
import path from 'path';

const base = path.resolve(__dirname, '../../../apps/realtutorialhub-web/src/components/content/modular');
const sections = ['notes', 'layman', 'reallife', 'technical', 'visual', 'code', 'quiz', 'practice', 'assignment', 'project'];

console.log('Section\t\tLayout Spec\tRenderer Support\tStyle Tokens\tDisplay Parity');
console.log('-----------------------------------------------------------------------------------------');

sections.forEach(s => {
    const dirName = s;
    let fileName = s.charAt(0).toUpperCase() + s.slice(1) + 'ModularRenderer.tsx';
    if (s === 'reallife') fileName = 'RealLifeModularRenderer.tsx';
    
    const filePath = path.join(base, dirName, fileName);
    if (!fs.existsSync(filePath)) {
        console.log(`${s.toUpperCase().padEnd(12)}\t❌ MISSING\t❌ MISSING\t\t❌ MISSING\t0%`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const hasLayout = content.includes('const layoutStyle = data.layout');
    const hasSpacing = content.includes('const spacing = data.spacing');
    const hasDynamicStyle = /style=\{\{\s*gap:\s*spacing/.test(content);

    const support = hasLayout && hasSpacing && hasDynamicStyle ? '✅ DYNAMIC' : '⚠️ HARDCODED';
    const tokens = hasLayout ? '✅ MAPPED' : '❌ N/A';
    const parity = hasLayout && hasSpacing && hasDynamicStyle ? '100%' : '0%';

    console.log(`${s.toUpperCase().padEnd(12)}\t✅ FOUND\t${support.padEnd(12)}\t${tokens.padEnd(12)}\t${parity}`);
});
