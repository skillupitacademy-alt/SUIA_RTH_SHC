const fs = require('fs');
const path = require('path');

const componentsToDynamic = [
    'ContentReadinessBoard',
    'PerformanceAnalyticsBoard',
    'AdminReportPipelineCard',
    'LiveSessionsList',
    'ServiceHealth',
    'ExamActivityBoard',
    'EfficiencyQuadrant',
    'SystemAuditTerminal',
    'UserAnalyticsPanel',
    'ControlCenterDeck',
    'SecurityHealthPanel',
    'BlueprintAuditBoard'
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('page.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            let needsImports = false;

            for (const component of componentsToDynamic) {
                const regex = new RegExp(`import { ${component} } from "(?:@/components/dashboard/${component})";?`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, `const ${component} = dynamic(() => import("@/components/dashboard/${component}").then(mod => ({ default: mod.${component} })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });`);
                    modified = true;
                    needsImports = true;
                }
            }

            if (needsImports) {
                if (!content.includes("import dynamic from 'next/dynamic'")) {
                    content = `import dynamic from 'next/dynamic';\nimport { ZSkeleton } from '@quiz/ui';\n` + content;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory('apps/admin-app/src/app/(authenticated)/dashboard');
console.log('Done');
