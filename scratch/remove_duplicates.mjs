import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The duplicate/broken blocks start at line 3279 (roughly) and end at line 3300
// We want to delete from "        </div>" followed by "        )}" up to the end of the second output section.

content = content.replace(
  /\s+<\/div>\s+\)\}\s+\{generatedAssetPrompt && \([\s\S]*?<\/section>\s+\)\}/,
  '\n        </div>'
);

fs.writeFileSync(filePath, content);
console.log('Removed duplicate/broken output sections from Prompt Generator.');
