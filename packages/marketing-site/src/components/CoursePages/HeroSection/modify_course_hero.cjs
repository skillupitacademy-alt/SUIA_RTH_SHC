const fs = require('fs');
const path = require('path');

const basePath = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/CoursePages/HeroSection';

// 1. MainHeroSection.tsx
let mainFile = path.join(basePath, 'MainHeroSection.tsx');
let mainContent = fs.readFileSync(mainFile, 'utf8');
mainContent = mainContent.replace('backgroundColor: "var(--brand-primary)"', 'backgroundColor: "#ffffff"');
mainContent = mainContent.replace('text-white/60 text-sm', 'text-[var(--brand-primary)] opacity-70 text-sm font-medium');
mainContent = mainContent.replace('bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10', 'bg-white shadow-md rounded-xl border border-gray-100 hover:border-[var(--brand-primary)]');
mainContent = mainContent.replace('text-white/70 font-semibold', 'text-[var(--brand-primary)] font-semibold');
fs.writeFileSync(mainFile, mainContent, 'utf8');

// 2. HeroContent.tsx
let contentFile = path.join(basePath, 'HeroContent.tsx');
let contentContent = fs.readFileSync(contentFile, 'utf8');
contentContent = contentContent.replace('backgroundColor: "color-mix(in srgb, var(--brand-secondary) 25%, transparent)"', 'backgroundColor: "color-mix(in srgb, var(--brand-secondary) 15%, transparent)"');
contentContent = contentContent.replace('text-yellow-400', 'text-[var(--brand-primary)]');
contentContent = contentContent.replace('<span className="text-white font-semibold">', '<span className="text-[var(--brand-primary)] font-semibold">');
contentContent = contentContent.replace('text-white drop-shadow-2xl', 'text-[var(--brand-primary)] drop-shadow-md');
contentContent = contentContent.replace('text-white/90', 'text-[var(--brand-primary)] opacity-90');
contentContent = contentContent.replace('text-white/80', 'text-[var(--brand-primary)] opacity-80');
fs.writeFileSync(contentFile, contentContent, 'utf8');

// 3. HeroFeature.tsx
let featureFile = path.join(basePath, 'HeroFeature.tsx');
let featureContent = fs.readFileSync(featureFile, 'utf8');
featureContent = featureContent.replace('bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40', 'bg-white shadow-md rounded-full border border-gray-100 hover:bg-gray-50 hover:border-[var(--brand-primary)]');
featureContent = featureContent.replace('text-white/90', 'text-[var(--brand-primary)]');
fs.writeFileSync(featureFile, featureContent, 'utf8');

// 4. HeroStats.tsx
let statsFile = path.join(basePath, 'HeroStats.tsx');
let statsContent = fs.readFileSync(statsFile, 'utf8');
statsContent = statsContent.replace('bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2 overflow-hidden shadow-xl hover:shadow-2xl', 'bg-white rounded-3xl p-8 border border-gray-100 transition-all duration-300 hover:scale-105 hover:-translate-y-2 overflow-hidden shadow-xl hover:shadow-2xl');
statsContent = statsContent.replace('rgba(255, 255, 255, 1)', 'var(--brand-primary)');
statsContent = statsContent.replace('rgba(255, 255, 255, 0.6)', 'var(--brand-secondary)');
statsContent = statsContent.replace('bg-white/20 backdrop-blur-sm', 'bg-gray-50 border border-gray-100');
statsContent = statsContent.replace('text-white', 'text-[var(--brand-primary)]');
statsContent = statsContent.replace('text-white', 'text-[var(--brand-primary)]'); // it occurs multiple times, using replaceAll or multiple replaces
statsContent = statsContent.split('text-white').join('text-[var(--brand-primary)]'); // replace all occurrences of text-white
statsContent = statsContent.split('text-[var(--brand-primary)]/80').join('text-[var(--brand-secondary)] font-medium');
fs.writeFileSync(statsFile, statsContent, 'utf8');

console.log('Modified Course Hero components successfully.');
