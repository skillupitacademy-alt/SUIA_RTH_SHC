const fs = require('fs');

const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/HeroSection/HeroSlider.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. SlideIndicator dots
content = content.replace(
  'w-8 md:w-12 bg-white',
  'w-8 md:w-12 bg-gray-800'
);
content = content.replace(
  'w-2 bg-white/40 hover:bg-white/60',
  'w-2 bg-gray-300 hover:bg-gray-400'
);

// 2. heroBackground
content = content.replace(
  'const heroBackground =\r\n    current % 2 === 0 ? brand.colors.primary : brand.colors.secondary;',
  'const heroBackground = "#ffffff";\r\n  const activeColor = current % 2 === 0 ? "var(--brand-primary)" : "var(--brand-secondary)";'
);
// fallback in case of \n
content = content.replace(
  'const heroBackground =\n    current % 2 === 0 ? brand.colors.primary : brand.colors.secondary;',
  'const heroBackground = "#ffffff";\n  const activeColor = current % 2 === 0 ? "var(--brand-primary)" : "var(--brand-secondary)";'
);

// 3. renderBadge
content = content.replace(
  'bg-white/20 backdrop-blur-sm',
  'bg-gray-100'
);
content = content.replace(
  '<Sparkles className="text-white" />\r\n      <span className="text-white text-sm font-medium">',
  '<Sparkles style={{ color: activeColor }} />\r\n      <span className="text-sm font-medium" style={{ color: activeColor }}>'
);
content = content.replace(
  '<Sparkles className="text-white" />\n      <span className="text-white text-sm font-medium">',
  '<Sparkles style={{ color: activeColor }} />\n      <span className="text-sm font-medium" style={{ color: activeColor }}>'
);

// 4. renderButtons btn1
content = content.replace(
  'bg-white text-gray-900 rounded-lg font-semibold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2"',
  'rounded-lg font-semibold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-white"\n        style={{ backgroundColor: activeColor }}'
);

// 5. renderButtons btn2
content = content.replace(
  '<button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white rounded-lg font-semibold text-lg hover:bg-white/20 hover:scale-105 transition-all">',
  '<button className="px-8 py-4 bg-transparent border-2 rounded-lg font-semibold text-lg hover:bg-gray-50 hover:scale-105 transition-all" style={{ borderColor: activeColor, color: activeColor }}>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced contents.');
