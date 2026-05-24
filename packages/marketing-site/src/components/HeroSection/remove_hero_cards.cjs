const fs = require('fs');
const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/HeroSection/HeroSlider.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove renderTopCards invocation from JSX
content = content.replace(
  '{startSlider && renderTopCards()}',
  ''
);

// 2. Remove renderTopCards function definition
const renderTopCardsRegex = /const renderTopCards = \(\) => \{[\s\S]*?return \([\s\S]*?<div className="absolute top-8 left-0 right-0 w-full hidden md:flex justify-start gap-12 px-12 lg:px-24 z-20">([\s\S]*?)<\/div>\s*\);\s*\};/m;
content = content.replace(renderTopCardsRegex, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Removed Top Cards completely');
