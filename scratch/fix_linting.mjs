import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/content-manager/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix unused error
content = content.replace(/\} catch \(error\) \{/g, '} catch {');

// 2. Fix unescaped quotes
content = content.replace(
  /click <strong>"Fetch Existing JSON"<\/strong>/g,
  'click <strong>&quot;Fetch Existing JSON&quot;</strong>'
);

fs.writeFileSync(filePath, content);
console.log('Fixed linting issues in Content Manager.');
