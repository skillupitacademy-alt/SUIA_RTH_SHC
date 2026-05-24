const fs = require('fs');
const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/CoursesCardData.ts';

let content = fs.readFileSync(path, 'utf8');

const regex = /title:\s*"([^"]+)",[\s\S]*?slug:\s*"([^"]+)"[\s\S]*?certificateDetails:\s*\{[\s\S]*?subSubtitle:\s*'([^']+)'/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(match[1], '|', match[2], '|', match[3]);
}
