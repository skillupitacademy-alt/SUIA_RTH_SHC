const fs = require('fs');

const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/CoursePages/HeroSection/HeroContent.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'text-[var(--brand-primary)] opacity-80',
  'text-[var(--brand-secondary)] opacity-90 font-medium'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified Course Hero subDescription successfully');
