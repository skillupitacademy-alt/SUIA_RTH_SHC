const fs = require('fs');
const path = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/HeroSection/HeroSlider.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace renderSquareCards completely
const renderSquareCardsRegex = /const renderSquareCards = \(\) => \{[\s\S]*?return \([\s\S]*?<div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-0 h-full content-between">([\s\S]*?)<\/div>\s*\);\s*\};/m;

const newCardRenderers = `const renderTopCards = () => {
    return (
      <div className="hidden md:flex gap-4 mb-6">
        {currentSlide.floatingIcons.slice(0, 3).map((item, idx) => {
          const Icon = ICON_MAP[item.icon];
          if (!Icon) return null;
          const cardColor = idx % 2 === 0 ? "var(--brand-primary)" : "var(--brand-secondary)";
          return (
            <div
              key={\`top-\${current}-\${idx}\`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-md transition-transform hover:scale-105"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: \`color-mix(in srgb, \${cardColor} 12%, white)\` }}
              >
                <Icon style={{ color: cardColor, width: 18, height: 18 }} />
              </div>
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRightCards = () => {
    return (
      <div className="hidden md:flex flex-col justify-between h-full py-4 gap-6">
        {currentSlide.floatingIcons.slice(3, 6).map((item, idx) => {
          const Icon = ICON_MAP[item.icon];
          if (!Icon) return null;
          const cardColor = idx % 2 !== 0 ? "var(--brand-primary)" : "var(--brand-secondary)";
          return (
            <div
              key={\`right-\${current}-\${idx}\`}
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

content = content.replace(renderSquareCardsRegex, newCardRenderers);

// 2. Update Desktop section layout
const desktopSectionRegex = /\{\/\* Desktop \*\/\}\s*<div className="hidden md:flex relative h-full items-center justify-between px-12 lg:px-24">\s*<div className="max-w-2xl z-10 flex flex-col justify-center">\s*<HeroText index=\{current\} \/>\s*\{startSlider && renderBadge\(\)\}\s*\{renderButtons\(\)\}\s*<\/div>\s*<div className="w-1\/2 h-full flex justify-end gap-8 py-24">\s*<div className="flex-1 flex items-center h-full w-full">\s*\{startSlider && renderDesktopImage\(\)\}\s*<\/div>\s*\{startSlider && renderSquareCards\(\)\}\s*<\/div>\s*<\/div>/m;

const newDesktopSection = `{/* Desktop */}
      <div className="hidden md:flex relative h-full items-center justify-between px-12 lg:px-24">
        <div className="max-w-2xl z-10 flex flex-col justify-center">
          {startSlider && renderTopCards()}
          <HeroText index={current} />
          {startSlider && renderBadge()}
          {renderButtons()}
        </div>

        <div className="w-1/2 h-full flex justify-end gap-8 py-24">
          <div className="flex-1 flex items-center h-full w-full">
            {startSlider && renderDesktopImage()}
          </div>
          {startSlider && renderRightCards()}
        </div>
      </div>`;

content = content.replace(desktopSectionRegex, newDesktopSection);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified HeroSlider to separate top and right cards');
