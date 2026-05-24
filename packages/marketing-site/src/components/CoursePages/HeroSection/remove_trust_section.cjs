const fs = require('fs');

const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/CoursePages/HeroSection/MainHeroSection.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the entire Trust Indicators block
const regex = /\s*\{\/\* Trust Indicators \*\/\}[\s\S]*?\}\s*\)\s*\}\s*<\/div>\s*<\/div>/m;
content = content.replace(regex, '\n      </div>\n    </div>');

fs.writeFileSync(path, content, 'utf8');
console.log('Trust Indicators removed successfully.');
