const fs = require('fs');
const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/HeroSection/HeroSlider.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<div className="w-full max-w-lg mx-auto">',
  '<div className="w-full max-w-lg ml-auto">'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed mx-auto to ml-auto');
