const fs = require('fs');
const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/HeroSection/HeroSlider.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove activeColor variable
content = content.replace(
  'const activeColor = current % 2 === 0 ? "var(--brand-primary)" : "var(--brand-secondary)";',
  ''
);

// 2. Update renderSquareCards to alternate colors per card
const renderSquareCardsRegex = /const renderSquareCards = \(\) => \{[\s\S]*?return \([\s\S]*?<div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-0 h-full content-between">([\s\S]*?)<\/div>\s*\);\s*\};/m;

const newRenderSquareCards = `const renderSquareCards = () => {
    return (
      <div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-0 h-full content-between">
        {currentSlide.floatingIcons.map((item, idx) => {
          const Icon = ICON_MAP[item.icon];
          if (!Icon) return null;
          
          // ALGORITHM: Alternate primary and secondary color per card
          const cardColor = idx % 2 === 0 ? "var(--brand-primary)" : "var(--brand-secondary)";
          
          return (
            <div
              key={\`\${current}-\${idx}\`}
              className="flex flex-col items-center justify-center gap-3 w-28 h-28 rounded-2xl bg-white border border-gray-100 shadow-md transition-transform hover:scale-105"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: \`color-mix(in srgb, \${cardColor} 12%, white)\` }}
              >
                <Icon style={{ color: cardColor, width: 24, height: 24 }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center px-1">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };`;

content = content.replace(renderSquareCardsRegex, newRenderSquareCards);

// 3. Update renderBadge to use primary
content = content.replace(
  '<Sparkles style={{ color: activeColor }} />',
  '<Sparkles style={{ color: "var(--brand-primary)" }} />'
);
content = content.replace(
  '<span className="text-sm font-medium" style={{ color: activeColor }}>',
  '<span className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>'
);

// 4. Update renderButtons to use both colors
content = content.replace(
  'style={{ backgroundColor: activeColor }}',
  'style={{ backgroundColor: "var(--brand-primary)" }}'
);
content = content.replace(
  'style={{ borderColor: activeColor, color: activeColor }}',
  'style={{ borderColor: "var(--brand-secondary)", color: "var(--brand-secondary)" }}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified HeroSlider to use both brand colors per slide');
