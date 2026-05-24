const fs = require('fs');
const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/CoursesCardData.ts';

let content = fs.readFileSync(path, 'utf8');

const regex = /slug:\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(match[1]);
}
